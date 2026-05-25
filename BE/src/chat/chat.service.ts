import { Injectable, Inject, Logger } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { v4 as uuidv4 } from 'uuid';
import { IndexingService } from '../indexing/indexing.service';
import { LLM_INSTANCE } from '../llm/llm.tokens';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { contextualizeQPrompt, qaPrompt } from './prompts';
import { ChatPreprocService } from './chat.preproc.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly sessions = new Map<string, BaseMessage[]>();
  private readonly outputParser = new StringOutputParser();
  private readonly k = 4;

  constructor(
    @Inject(LLM_INSTANCE) private readonly llm: BaseChatModel,
    private readonly indexingService: IndexingService,
    private readonly chatPreprocService: ChatPreprocService,
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

    // Step 1 — Aggiungi contesto alla domanda in presenza di una cronologia, viene preprocessata per migliorare il retrieve.
    let standaloneQuestion = dto.message;
    if (history.length > 0) {
      standaloneQuestion = await contextualizeQPrompt
        .pipe(this.llm)
        .pipe(this.outputParser)
        .invoke({ input: dto.message, chat_history: history });
    }

    // Step 2 — Recupera i documenti più rilevanti per la domanda.

    standaloneQuestion =
      this.chatPreprocService.preprocessQuery(standaloneQuestion);
    const retriever = this.indexingService.getRetriever(this.k);
    const relevantDocs: Document[] = await retriever.invoke(standaloneQuestion);
    const contextText = relevantDocs.map((d) => d.pageContent).join('\n\n');

    // Step 3 — Genera una risposta basata sul contesto recuperato
    const answer = await qaPrompt
      .pipe(this.llm)
      .pipe(this.outputParser)
      .invoke({
        input: dto.message,
        chat_history: history,
        context: contextText,
      });

    // Aggiorna la cronologia della sessione
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
