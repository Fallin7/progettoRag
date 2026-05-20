export class DocumentResponseDto {
  name: string;
  size: number;
  chunks: number;
  uploadedAt: string;

  constructor(name: string, size: number, chunks: number, uploadedAt: string) {
    this.name = name;
    this.size = size;
    this.chunks = chunks;
    this.uploadedAt = uploadedAt;
  }
}
