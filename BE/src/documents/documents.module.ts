import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { IndexingModule } from '../indexing/indexing.module';
import { DocumentsPreprocessingService } from './documents.preprocessing.service';

@Module({
  imports: [IndexingModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsPreprocessingService],
})
export class DocumentsModule {}
