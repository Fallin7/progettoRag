import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Document } from '@langchain/core/documents';
import { Embeddings } from '@langchain/core/embeddings';
import { existsSync } from 'fs';
import { EMBEDDINGS_INSTANCE } from '../llm/llm.tokens';

@Injectable()
export class IndexingService implements OnModuleInit {
  private readonly logger = new Logger(IndexingService.name);
  private vectorStore: FaissStore | null = null;
  private readonly indexPath: string;

  constructor(
    @Inject(EMBEDDINGS_INSTANCE) private readonly embeddings: Embeddings,
    private readonly configService: ConfigService,
  ) {
    this.indexPath =
      this.configService.get<string>('documentsIndexPath') ??
      './documents_index';
  }

  async onModuleInit() {
    if (existsSync(this.indexPath)) {
      try {
        this.vectorStore = await FaissStore.load(
          this.indexPath,
          this.embeddings,
        );
        this.logger.log(`FAISS index loaded from "${this.indexPath}"`);
      } catch (err) {
        this.logger.warn(
          `Failed to load FAISS index, will create on first upload: ${err}`,
        );
      }
    } else {
      this.logger.log(
        'No existing FAISS index found — will create on first document upload',
      );
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.vectorStore) {
      this.vectorStore = await FaissStore.fromDocuments(
        documents,
        this.embeddings,
      );
    } else {
      await this.vectorStore.addDocuments(documents);
    }
    await this.vectorStore.save(this.indexPath);
    this.logger.log(
      `Indexed ${documents.length} chunks → saved to "${this.indexPath}"`,
    );
  }

  async similaritySearch(query: string, k = 4): Promise<Document[]> {
    if (!this.vectorStore) return [];
    return this.vectorStore.similaritySearch(query, k);
  }

  getRetriever(k = 4) {
    if (!this.vectorStore) {
      throw new Error(
        'Vector store not ready. Upload at least one document first.',
      );
    }
    return this.vectorStore.asRetriever(k);
  }

  isReady(): boolean {
    return this.vectorStore !== null;
  }
}
