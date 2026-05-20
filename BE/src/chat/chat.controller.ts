import { Controller, Post, Delete, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  sendMessage(@Body() dto: SendMessageDto): Promise<ChatResponseDto> {
    return this.chatService.sendMessage(dto);
  }

  @Delete('session/:id')
  deleteSession(@Param('id') id: string): { success: boolean } {
    this.chatService.deleteSession(id);
    return { success: true };
  }
}
