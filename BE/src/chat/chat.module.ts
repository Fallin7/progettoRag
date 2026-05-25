import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { IndexingModule } from '../indexing/indexing.module';
import { ChatPreprocService } from './chat.preproc.service';

@Module({
  imports: [IndexingModule],
  controllers: [ChatController],
  providers: [ChatService, ChatPreprocService],
})
export class ChatModule {}
