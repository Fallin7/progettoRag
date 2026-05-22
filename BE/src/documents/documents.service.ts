import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { IndexingService } from '../indexing/indexing.service';
import { DocumentResponseDto } from './dto/document-response.dto';
import { PDFParse } from 'pdf-parse';
import { DocumentsPreprocessingService } from './documents.preprocessing.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadedDocuments: DocumentResponseDto[] = [];
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // Dimensione massima di ogni chunk
    chunkOverlap: 200, // Sovrapposizione tra chunk per mantenere il contesto
  });

  constructor(
    private readonly indexingService: IndexingService,
    private readonly preprocessingService: DocumentsPreprocessingService,
  ) {}

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

    const cleanedText = this.preprocessingService.preprocessText(text);

    const chunks = await this.splitter.createDocuments(
      [cleanedText],
      [{ source: file.originalname, fileSize: file.size }],
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
    return response;
  }

  getDocuments(): DocumentResponseDto[] {
    return this.uploadedDocuments;
  }
}
