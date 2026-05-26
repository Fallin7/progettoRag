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

  async retrieveContext(
    sessionId: string,
    dto: SendMessageDto,
  ): Promise<{
    context: string;
    sources: string[];
    history: BaseMessage[];
  }> {
    if (!this.indexingService.isReady()) {
      this.logger.warn('Context retrieval requested but no documents indexed');
      throw new Error(
        'No documents have been indexed yet. Please upload at least one document first.',
        { cause: 'NO_DOCUMENTS' },
      );
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
    const context = relevantDocs.map((d) => d.pageContent).join('\n\n');

    const sources = relevantDocs
      .map((d) => d.metadata?.source as string)
      .filter((s): s is string => Boolean(s))
      .filter((v, i, a) => a.indexOf(v) === i);

    return { context, sources, history };
  }

  async sendMessage(dto: SendMessageDto): Promise<ChatResponseDto> {
    const sessionId = dto.sessionId ?? uuidv4();
    const { context, sources, history } = await this.retrieveContext(
      sessionId,
      dto,
    );

    // Step 3 — Genera una risposta basata sul contesto recuperato
    const answer = await qaPrompt
      .pipe(this.llm)
      .pipe(this.outputParser)
      .invoke({
        input: dto.message,
        chat_history: history,
        context: context,
      });

    // Aggiorna la cronologia della sessione
    this.sessions.set(sessionId, [
      ...history,
      new HumanMessage(dto.message),
      new AIMessage(answer),
    ]);

    this.logger.log(
      `Session "${sessionId}" → answered (${sources.length} source(s))`,
    );

    return { answer, sessionId, sources };
  }
  async *errorStream(errorMsg: string): AsyncGenerator<string> {
    await Promise.resolve();
    yield errorMsg;
  }

  async streamMessage(dto: SendMessageDto): Promise<{
    stream: AsyncIterable<string>;
    sessionId: string;
    sources: string[];
    onComplete: (fullAnswer: string) => void;
  }> {
    const sessionId = dto.sessionId ?? uuidv4();
    try {
      const { context, sources, history } = await this.retrieveContext(
        sessionId,
        dto,
      );

      const stream = await qaPrompt
        .pipe(this.llm)
        .pipe(this.outputParser)
        .stream({
          input: dto.message,
          chat_history: history,
          context: context,
        });

      const onComplete = (fullAnswer: string) => {
        this.sessions.set(sessionId, [
          ...history,
          new HumanMessage(dto.message),
          new AIMessage(fullAnswer),
        ]);
        this.logger.log(
          `Session "${sessionId}" → streamed (${sources.length} source(s))`,
        );
      };
      return { stream, sessionId, sources, onComplete };
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : `Unexpected error: ${e}`;
      return {
        stream: this.errorStream(`Error: ${errorMessage}`),
        sessionId,
        sources: [],
        onComplete: () => {},
      };
    }
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.logger.log(`Session "${sessionId}" deleted`);
  }
}
