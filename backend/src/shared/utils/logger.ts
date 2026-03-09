import pino from 'pino';

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

export const logger = Object.assign(baseLogger, {
  chatbot(event: string, scope: string, meta?: Record<string, unknown>) {
    baseLogger.info({ event: `chatbot:${event}`, scope, ...meta });
  },

  chatbotError(event: string, message: string, meta?: Record<string, unknown>) {
    baseLogger.error({ event: `chatbot:${event}`, error: message, ...meta });
  },

  chatbotStream(conversationIdOrStatus: string, modelOrStatus: string, meta?: Record<string, unknown>) {
    baseLogger.info({ event: 'chatbot:stream', status: conversationIdOrStatus, model: modelOrStatus, ...meta });
  },

  chatbotRetrieval(scope: string, chunkCount: number, durationMs: number, meta?: Record<string, unknown>) {
    baseLogger.info({ event: 'chatbot:retrieval', scope, chunkCount, durationMs, ...meta });
  },

  auth(message: string, meta?: Record<string, unknown>) {
    baseLogger.info({ event: 'auth', message, ...meta });
  },

  created(entity: string, id: string, meta: Record<string, unknown>) {
    baseLogger.info({ event: 'created', entity, id, ...meta });
  },

  updated(entity: string, id: string, meta: Record<string, unknown>) {
    baseLogger.info({ event: 'updated', entity, id, ...meta });
  },

  deleted(entity: string, id: string, meta: Record<string, unknown>) {
    baseLogger.info({ event: 'deleted', entity, id, ...meta });
  },
});
