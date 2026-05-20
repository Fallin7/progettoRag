import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { IndexingModule } from '../indexing/indexing.module';

@Module({
  imports: [IndexingModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
