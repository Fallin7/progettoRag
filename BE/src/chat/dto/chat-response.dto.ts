export class ChatResponseDto {
  answer: string;
  sessionId: string;
  sources: string[];

  constructor(answer: string, sessionId: string, sources: string[]) {
    this.answer = answer;
    this.sessionId = sessionId;
    this.sources = sources;
  }
}
