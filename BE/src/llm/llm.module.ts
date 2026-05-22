import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { LLM_INSTANCE, EMBEDDINGS_INSTANCE } from './llm.tokens';

//Initialize LLM and Embeddings providers based on configuration, and make them globally available via NestJS's dependency injection system.
@Global()
@Module({
  providers: [
    {
      provide: LLM_INSTANCE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('llmProvider');
        if (provider === 'ollama') {
          return new ChatOllama({
            baseUrl: config.get<string>('ollama.baseUrl'),
            model: config.get<string>('ollama.model'),
          });
        }
        return new ChatOpenAI({
          apiKey: config.get<string>('openai.apiKey'),
          model: config.get<string>('openai.model'),
        });
      },
    },
    {
      provide: EMBEDDINGS_INSTANCE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('llmProvider');
        if (provider === 'ollama') {
          return new OllamaEmbeddings({
            baseUrl: config.get<string>('ollama.baseUrl'),
            model: config.get<string>('ollama.embeddingsModel'),
          });
        }
        return new OpenAIEmbeddings({
          apiKey: config.get<string>('openai.apiKey'),
          model: config.get<string>('openai.embeddingsModel'),
        });
      },
    },
  ],
  exports: [LLM_INSTANCE, EMBEDDINGS_INSTANCE],
})
export class LlmModule {}
