import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { IndexingService } from '../indexing/indexing.service';
import { DocumentResponseDto } from './dto/document-response.dto';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadedDocuments: DocumentResponseDto[] = [];
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  constructor(private readonly indexingService: IndexingService) {}

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

    const chunks = await this.splitter.createDocuments(
      [text],
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
