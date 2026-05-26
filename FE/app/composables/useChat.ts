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
      const response = await fetch(`${config.public.apiBase}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionId.value }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Aggiunge subito il placeholder del messaggio assistente
      messages.value.push({ role: "assistant", content: "", sources: [] });
      const assistantIndex = messages.value.length - 1;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const payload = JSON.parse(part.slice(6)) as {
            type: "meta" | "chunk" | "done";
            sessionId?: string;
            sources?: string[];
            content?: string;
          };
          const assistantMsg = messages.value[assistantIndex];
          if (!assistantMsg) continue;
          if (payload.type === "meta") {
            sessionId.value = payload.sessionId!;
            assistantMsg.sources = payload.sources ?? [];
          } else if (payload.type === "chunk") {
            assistantMsg.content += payload.content ?? "";
          }
        }
      }
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
