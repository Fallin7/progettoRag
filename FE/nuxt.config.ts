// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      // Override via NUXT_PUBLIC_API_BASE env var in production
      apiBase: "http://localhost:3001",
    },
  },
});
