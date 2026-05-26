import { Controller, Post, Delete, Body, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
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

  @Post('stream')
  async streamMessage(
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const { stream, sessionId, sources, onComplete } =
      await this.chatService.streamMessage(dto);

    res.write(
      `data: ${JSON.stringify({ type: 'meta', sessionId, sources })}\n\n`,
    );

    let fullAnswer = '';
    for await (const chunk of stream) {
      fullAnswer += chunk;
      res.write(
        `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`,
      );
    }

    onComplete(fullAnswer);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  }

  @Delete('session/:id')
  deleteSession(@Param('id') id: string): { success: boolean } {
    this.chatService.deleteSession(id);
    return { success: true };
  }
}
