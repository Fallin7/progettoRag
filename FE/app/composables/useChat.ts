export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export function useChat() {
  const messages = ref<Message[]>([]);
  const sessionId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const config = useRuntimeConfig();

  async function sendMessage(text: string) {
    if (!text.trim() || loading.value) return;

    messages.value.push({ role: "user", content: text });
    loading.value = true;
    error.value = null;

    try {
      const res = await $fetch<{
        answer: string;
        sessionId: string;
        sources: string[];
      }>(`${config.public.apiBase}/chat/message`, {
        method: "POST",
        body: { message: text, sessionId: sessionId.value },
      });
      sessionId.value = res.sessionId;
      messages.value.push({
        role: "assistant",
        content: res.answer,
        sources: res.sources,
      });
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string }; message?: string })?.data
          ?.message ??
        (e as { message?: string })?.message ??
        "Unknown error";
      error.value = msg;
      messages.value.push({ role: "assistant", content: `Error: ${msg}` });
    } finally {
      loading.value = false;
    }
  }

  async function clearSession() {
    if (sessionId.value) {
      await $fetch(`${config.public.apiBase}/chat/session/${sessionId.value}`, {
        method: "DELETE",
      }).catch(() => {});
    }
    messages.value = [];
    sessionId.value = null;
  }

  return { messages, sessionId, loading, error, sendMessage, clearSession };
}
