import { Injectable, Inject, Logger } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { v4 as uuidv4 } from 'uuid';
import { IndexingService } from '../indexing/indexing.service';
import { LLM_INSTANCE } from '../llm/llm.tokens';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly sessions = new Map<string, BaseMessage[]>();
  private readonly outputParser = new StringOutputParser();

  /** Reformulates the question as standalone when history is present */
  private readonly contextualizeQPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `Given a chat history and the latest user question which might reference context in the \
chat history, formulate a standalone question that can be understood without the chat history. \
Do NOT answer the question, just reformulate it if needed and otherwise return it as is.`,
    ],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
  ]);

  /** QA prompt that injects retrieved context */
  private readonly qaPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an assistant for question-answering tasks. \
Use the following pieces of retrieved context to answer the question. \
If the answer is not present in the provided context, say that the information is not available \
in the uploaded documents. Keep the answer concise and accurate.

Context:
{context}`,
    ],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
  ]);

  constructor(
    @Inject(LLM_INSTANCE) private readonly llm: BaseChatModel,
    private readonly indexingService: IndexingService,
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<ChatResponseDto> {
    const sessionId = dto.sessionId ?? uuidv4();

    if (!this.indexingService.isReady()) {
      this.logger.warn('Chat requested but no documents indexed');
      return {
        answer:
          'No documents have been indexed yet. Please upload at least one document first.',
        sessionId,
        sources: [],
      };
    }

    const history = this.sessions.get(sessionId) ?? [];

    // Step 1 — Reformulate question as standalone when there is history
    let standaloneQuestion = dto.message;
    if (history.length > 0) {
      standaloneQuestion = await this.contextualizeQPrompt
        .pipe(this.llm)
        .pipe(this.outputParser)
        .invoke({ input: dto.message, chat_history: history });
    }

    // Step 2 — Retrieve relevant chunks
    const retriever = this.indexingService.getRetriever(4);
    const relevantDocs: Document[] = await retriever.invoke(standaloneQuestion);
    const contextText = relevantDocs.map((d) => d.pageContent).join('\n\n');

    // Step 3 — Generate answer grounded in retrieved context
    const answer = await this.qaPrompt
      .pipe(this.llm)
      .pipe(this.outputParser)
      .invoke({
        input: dto.message,
        chat_history: history,
        context: contextText,
      });

    // Update session history
    this.sessions.set(sessionId, [
      ...history,
      new HumanMessage(dto.message),
      new AIMessage(answer),
    ]);

    const sources = relevantDocs
      .map((d) => d.metadata?.source as string)
      .filter((s): s is string => Boolean(s))
      .filter((v, i, a) => a.indexOf(v) === i);

    this.logger.log(
      `Session "${sessionId}" → answered (${sources.length} source(s))`,
    );

    return { answer, sessionId, sources };
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.logger.log(`Session "${sessionId}" deleted`);
  }
}
