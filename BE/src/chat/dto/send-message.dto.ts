export class SendMessageDto {
  message: string;
  sessionId?: string;

  constructor(message: string, sessionId?: string) {
    this.message = message;
    this.sessionId = sessionId;
  }
}
