export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  feOrigin: process.env.FE_ORIGIN ?? 'http://localhost:3000',
  llmProvider: process.env.LLM_PROVIDER ?? 'openai',
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    embeddingsModel:
      process.env.OPENAI_EMBEDDINGS_MODEL ?? 'text-embedding-ada-002',
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL ?? 'llama3',
    embeddingsModel: process.env.OLLAMA_EMBEDDINGS_MODEL ?? 'nomic-embed-text',
  },
  documentsIndexPath: process.env.DOCUMENTS_INDEX_PATH ?? './documents_index',
});
