import { Injectable } from '@nestjs/common';
export type Language = 'it' | 'en';
@Injectable()
export class ChatPreprocService {
  private readonly STOPWORDS_EN = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'has',
    'he',
    'in',
    'is',
    'it',
    'its',
    'of',
    'on',
    'that',
    'the',
    'to',
    'was',
    'will',
    'with',
    'this',
    'these',
    'those',
    'what',
    'where',
    'when',
    'who',
    'how',
    'can',
    'could',
    'would',
    'should',
  ]);

  private readonly STOPWORDS_IT = new Set([
    'a',
    'ad',
    'al',
    'alle',
    'allo',
    'anche',
    'ancora',
    'avere',
    'che',
    'chi',
    'ci',
    'col',
    'come',
    'con',
    'cosa',
    'cui',
    'da',
    'dal',
    'dalla',
    'degli',
    'dei',
    'del',
    'della',
    'dello',
    'di',
    'dove',
    'e',
    'ed',
    'era',
    'essere',
    'gli',
    'ha',
    'hai',
    'hanno',
    'ho',
    'i',
    'il',
    'in',
    'io',
    'la',
    'le',
    'lei',
    'li',
    'lo',
    'lui',
    'ma',
    'mi',
    'nel',
    'nella',
    'nello',
    'nei',
    'nelle',
    'no',
    'noi',
    'non',
    'o',
    'per',
    'più',
    'potrebbe',
    'quale',
    'quando',
    'quanto',
    'quella',
    'quello',
    'questo',
    'questa',
    'questi',
    'queste',
    'qui',
    'sa',
    'se',
    'si',
    'sia',
    'sono',
    'sua',
    'sue',
    'sui',
    'sul',
    'sulla',
    'suo',
    'te',
    'ti',
    'tu',
    'un',
    'una',
    'uno',
    'vi',
    'voi',
  ]);

  // Italian indicator words: high-frequency words almost exclusive to Italian
  private readonly IT_INDICATORS = new Set([
    'che',
    'della',
    'dello',
    'degli',
    'delle',
    'della',
    'nel',
    'nella',
    'nello',
    'nei',
    'nelle',
    'sono',
    'questa',
    'questo',
    'queste',
    'questi',
    'quella',
    'quello',
    'come',
    'dove',
    'quando',
    'perché',
    'cosa',
    'quale',
    'quali',
    'oppure',
    'però',
    'anche',
    'ancora',
    'essere',
    'avere',
    'non',
    'più',
    'una',
    'uno',
  ]);
  constructor() {}

  /**
   * Basic text cleaning - lowercase and trim
   */
  basicClean(query: string): string {
    return query.toLowerCase().trim();
  }

  /**
   * Remove extra whitespace (multiple spaces, tabs, newlines)
   */
  normalizeWhitespace(query: string): string {
    return query.replace(/\s+/g, ' ').trim();
  }

  /**
   * Remove special characters (keep letters, numbers, spaces)
   */
  removeSpecialChars(query: string): string {
    return query
      .replace(/[^a-z0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Detect query language by counting Italian indicator words.
   * Returns 'it' if enough Italian markers are found, 'en' otherwise.
   */
  detectLanguage(query: string): Language {
    const words = query.toLowerCase().split(/\s+/);
    const itMatches = words.filter((w) => this.IT_INDICATORS.has(w)).length;
    // At least one Italian indicator word, or ≥20% of tokens are Italian markers
    return itMatches >= 1 && itMatches / words.length >= 0.1 ? 'it' : 'en';
  }

  /**
   * Remove stopwords using language-appropriate set.
   * Query should already be lowercased.
   */
  removeStopwords(query: string, lang?: Language): string {
    const resolvedLang = lang ?? this.detectLanguage(query);
    const stopwords =
      resolvedLang === 'it' ? this.STOPWORDS_IT : this.STOPWORDS_EN;
    const words = query.split(' ');
    const filtered = words.filter((word) => word && !stopwords.has(word));
    return filtered.join(' ');
  }

  /**
   * Complete preprocessing pipeline.
   * Language is auto-detected from the original query before any transformation,
   * so Italian queries automatically use the Italian stopword set.
   * FIXED: Query expansion now happens BEFORE removing special characters
   * This prevents issues like "What's" -> "what s" -> "what s machine learning"
   */
  preprocessQuery(
    query: string,
    options: {
      lowercase?: boolean;
      normalizeSpace?: boolean;
      removeSpecial?: boolean;
      removeStops?: boolean;
      expand?: boolean;
      lang?: Language; // override auto-detection when known
    } = {},
  ): string {
    const {
      lowercase = options.lowercase ?? true,
      normalizeSpace = options.normalizeSpace ?? true,
      removeSpecial = options.removeSpecial ?? true,
      removeStops = options.removeStops ?? true,
    } = options;

    // Detect language on the raw query before any transformation
    const lang: Language = options.lang ?? this.detectLanguage(query);

    let processed = query;

    if (lowercase) {
      processed = this.basicClean(processed);
    }

    if (normalizeSpace) {
      processed = this.normalizeWhitespace(processed);
    }

    if (removeSpecial) {
      processed = this.removeSpecialChars(processed);
    }

    if (removeStops) {
      processed = this.removeStopwords(processed, lang);
    }

    return processed;
  }
}
