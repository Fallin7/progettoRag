import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { DocumentResponseDto } from './dto/document-response.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
      fileFilter: (_req, file, cb) => {
        const name = file.originalname.toLowerCase();
        const allowed =
          file.mimetype === 'application/pdf' ||
          file.mimetype === 'text/plain' ||
          name.endsWith('.pdf') ||
          name.endsWith('.txt');
        if (allowed) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Only PDF and TXT files are allowed'),
            false,
          );
        }
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentResponseDto> {
    if (!file) throw new BadRequestException('No file provided');
    return this.documentsService.processUpload(file);
  }

  @Get()
  getDocuments(): DocumentResponseDto[] {
    return this.documentsService.getDocuments();
  }
}
