import { createError, readBody } from 'h3';

interface ConversationMessageBody {
  message?: string;
  sessionId?: string | null;
  locale?: string;
}

export default defineEventHandler(async (event): Promise<void> => {
  const body = await readBody<ConversationMessageBody>(event);
  const message = body.message?.trim();

  if (!message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Message is required',
    });
  }

  const config = useRuntimeConfig(event);
  const apiBase = String(config.ecareApiBase || '').replace(/\/$/, '');
  const serviceSecret = String(config.ecareServiceSecret || '');
  const serviceSecretHeader = String(
    config.ecareServiceSecretHeader || 'x-service-secret',
  );

  if (!apiBase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'E-CARE API base URL is not configured',
    });
  }

  if (!serviceSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'E-CARE service secret is not configured',
    });
  }

  const upstreamResponse = await fetch(
    `${apiBase}/api/conversation/message/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [serviceSecretHeader]: serviceSecret,
      },
      body: JSON.stringify({
        message,
        sessionId: body.sessionId || undefined,
        locale: body.locale || 'it-IT',
      }),
    },
  );

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    const errorText = await upstreamResponse.text().catch(() => '');

    throw createError({
      statusCode: upstreamResponse.status || 502,
      statusMessage:
        errorText ||
        upstreamResponse.statusText ||
        'E-CARE conversation stream unavailable',
    });
  }

  const response = event.node.res;
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache, no-transform');
  response.setHeader('Connection', 'keep-alive');
  response.setHeader('X-Accel-Buffering', 'no');

  const reader = upstreamResponse.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      response.write(Buffer.from(value));
    }
  } finally {
    response.end();
    reader.releaseLock();
  }
});
