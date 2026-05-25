import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentsPreprocessingService {
  constructor() {}

  //Funzione che normalizza il testo rimuovendo spazi extra, convertendo a minuscolo e sostituendo caratteri speciali con spazi.
  preprocessText(text: string): string {
    return (
      text
        // Remove page markers like "-- 1 of 22 --" or "— 5 of 12 —"
        .replace(/[-–—]\s*\d+\s*of\s*\d+\s*[-–—]/gi, '')
        // Normalize multiple spaces and tabs
        .replace(/[ \t]+/g, ' ')
        // Preserve paragraph breaks but remove unnecessary empty lines
        .replace(/\n{3,}/g, '\n\n')
        // Trim start/end spaces
        .trim()
    );
  }
}
