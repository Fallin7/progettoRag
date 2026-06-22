// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    // Server-only values. Do not expose the service secret in public runtime config.
    ecareApiBase: process.env.NUXT_ECARE_API_BASE || 'http://localhost:3001',
    ecareServiceSecret: process.env.NUXT_ECARE_SERVICE_SECRET || '',
    ecareServiceSecretHeader:
      process.env.NUXT_ECARE_SERVICE_SECRET_HEADER || 'x-service-secret',
    public: {
      // Override via NUXT_PUBLIC_API_BASE env var in production
      apiBase: 'http://localhost:3001',
      ecareConversationLocale:
        process.env.NUXT_PUBLIC_ECARE_CONVERSATION_LOCALE || 'it-IT',
    },
  },
});
