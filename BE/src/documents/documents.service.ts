import {
  Injectable,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { IndexingService } from '../indexing/indexing.service';
import { DocumentResponseDto } from './dto/document-response.dto';
import { PDFParse } from 'pdf-parse';
import { DocumentsPreprocessingService } from './documents.preprocessing.service';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

@Injectable()
export class DocumentsService implements OnModuleInit {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadedDocuments: DocumentResponseDto[] = [];
  private readonly metadataPath: string;
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // Dimensione massima di ogni chunk
    chunkOverlap: 200, // Sovrapposizione tra chunk per mantenere il contesto
  });

  constructor(
    private readonly indexingService: IndexingService,
    private readonly preprocessingService: DocumentsPreprocessingService,
    private readonly configService: ConfigService,
  ) {
    const indexPath =
      this.configService.get<string>('documentsIndexPath') ??
      './documents_index';
    this.metadataPath = join(indexPath, 'documents-metadata.json');
  }

  onModuleInit() {
    if (existsSync(this.metadataPath)) {
      try {
        const raw = readFileSync(this.metadataPath, 'utf-8');
        const saved = JSON.parse(raw) as DocumentResponseDto[];
        this.uploadedDocuments.push(...saved);
        this.logger.log(
          `Loaded ${saved.length} document(s) metadata from "${this.metadataPath}"`,
        );
      } catch (err) {
        this.logger.warn(`Failed to load documents metadata: ${err}`);
      }
    } else {
      this.saveMetadata();
      this.logger.log(`Created empty metadata file at "${this.metadataPath}"`);
    }
  }

  private saveMetadata(): void {
    try {
      const dir = dirname(this.metadataPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(
        this.metadataPath,
        JSON.stringify(this.uploadedDocuments, null, 2),
        'utf-8',
      );
    } catch (err) {
      this.logger.warn(`Failed to save documents metadata: ${err}`);
    }
  }

  //Funzione che gestisce l'upload dei documenti, supportando PDF e TXT, estraendo il testo, suddividendolo in chunk, indicizzandolo e restituendo i metadati del documento caricato.
  async processUpload(file: Express.Multer.File): Promise<DocumentResponseDto> {
    const name = file.originalname.toLowerCase();
    let text: string;

    if (file.mimetype === 'application/pdf' || name.endsWith('.pdf')) {
      const parsed = await new PDFParse({ data: file.buffer }).getText();
      text = parsed.text;
    } else if (file.mimetype === 'text/plain' || name.endsWith('.txt')) {
      text = file.buffer.toString('utf-8');
    } else {
      throw new BadRequestException('Only PDF and TXT files are supported.');
    }

    if (!text.trim()) {
      throw new BadRequestException('The document appears to be empty.');
    }
    // Pulizia del testo per rimuovere spazi extra,
    // normalizzare i caratteri e preservare i paragrafi,
    // migliorando la qualità dei chunk generati e l'efficacia dell'indicizzazione.
    const cleanedText = this.preprocessingService.preprocessText(text);

    const chunks = await this.splitter.createDocuments(
      [cleanedText],
      [
        {
          source: file.originalname,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        },
      ],
    );

    await this.indexingService.addDocuments(chunks);
    this.logger.log(
      `Processed "${file.originalname}" → ${chunks.length} chunks`,
    );

    const response: DocumentResponseDto = {
      name: file.originalname,
      size: file.size,
      chunks: chunks.length,
      uploadedAt: new Date().toISOString(),
    };

    this.uploadedDocuments.push(response);
    this.saveMetadata();
    return response;
  }

  getDocuments(): DocumentResponseDto[] {
    return this.uploadedDocuments;
  }
}
