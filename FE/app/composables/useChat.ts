export interface Message {
  role: 'user' | 'assistant';
  content: string;
  warnings?: string[];
  uiCommands?: UiCommand[];
}

interface UiCommand {
  type:
    | 'NAVIGATE'
    | 'OPEN_PANEL'
    | 'SHOW_LIST'
    | 'START_CALL'
    | 'ASK_CLARIFICATION';
  payload?: Record<string, unknown>;
}

interface ConversationResponse {
  sessionId: string;
  intent:
    | 'PATIENT_SUMMARY'
    | 'PATIENT_CARE_TEAM'
    | 'PATIENT_EVENTS'
    | 'PATIENT_ALERTS'
    | 'ROBOTS_STATUS'
    | 'START_CALL'
    | 'UNKNOWN';
  message: string;
  uiCommands: UiCommand[];
  warnings?: string[];
}

type ConversationStreamEvent =
  | {
      type: 'meta';
      sessionId: string;
      uiCommands?: UiCommand[];
      warnings?: string[];
    }
  | {
      type: 'chunk';
      content?: string;
    }
  | {
      type: 'done';
      response: ConversationResponse;
    };

export function useChat() {
  const messages = ref<Message[]>([]);
  const sessionId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const config = useRuntimeConfig();

  async function sendMessage(text: string) {
    if (!text.trim() || loading.value) return;

    const locale = String(config.public.ecareConversationLocale || 'it-IT');

    messages.value.push({ role: 'user', content: text });
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('/api/conversation/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId.value,
          locale,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      messages.value.push({ role: 'assistant', content: '' });
      const assistantIndex = messages.value.length - 1;
      await readConversationStream(response.body, assistantIndex);
    } catch (e: unknown) {
      const msg =
        (e as { data?: { message?: string }; message?: string })?.data
          ?.message ??
        (e as { message?: string })?.message ??
        'Unknown error';
      error.value = msg;
      messages.value.push({ role: 'assistant', content: `Error: ${msg}` });
    } finally {
      loading.value = false;
    }
  }

  async function readConversationStream(
    stream: ReadableStream<Uint8Array>,
    assistantIndex: number,
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        buffer = consumeStreamBuffer(buffer, assistantIndex);
      }

      const remaining = decoder.decode();

      if (remaining) {
        buffer += remaining;
      }

      consumeStreamBuffer(`${buffer}\n\n`, assistantIndex);
    } finally {
      reader.releaseLock();
    }
  }

  function consumeStreamBuffer(buffer: string, assistantIndex: number): string {
    const events = buffer.split('\n\n');
    const remaining = events.pop() ?? '';

    for (const event of events) {
      const dataLines = event
        .split('\n')
        .filter((line) => line.startsWith('data: '))
        .map((line) => line.slice(6));

      if (dataLines.length === 0) {
        continue;
      }

      applyStreamEvent(JSON.parse(dataLines.join('\n')), assistantIndex);
    }

    return remaining;
  }

  function applyStreamEvent(
    event: ConversationStreamEvent,
    assistantIndex: number,
  ): void {
    const assistantMessage = messages.value[assistantIndex];

    if (!assistantMessage) {
      return;
    }

    if (event.type === 'meta') {
      sessionId.value = event.sessionId;
      assistantMessage.warnings = event.warnings;
      assistantMessage.uiCommands = event.uiCommands;
      return;
    }

    if (event.type === 'chunk') {
      assistantMessage.content += event.content ?? '';
      return;
    }

    sessionId.value = event.response.sessionId;
    assistantMessage.warnings = event.response.warnings;
    assistantMessage.uiCommands = event.response.uiCommands;

    if (!assistantMessage.content) {
      assistantMessage.content = event.response.message;
    }
  }

  function clearSession() {
    messages.value = [];
    sessionId.value = null;
  }

  return { messages, sessionId, loading, error, sendMessage, clearSession };
}
