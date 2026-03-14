import { config } from '@/config';
import { logger } from '@/shared/utils/logger';
import app from './app';

const port = config.server.port;

const adminSecret = process.env.CHATBOT_ADMIN_SECRET;
if (!adminSecret || adminSecret === 'admin123') {
  logger.warn('CHATBOT_ADMIN_SECRET is missing or set to the default "admin123" — change it before deploying to production');
} else if (adminSecret.length < 16) {
  logger.warn(`CHATBOT_ADMIN_SECRET is only ${adminSecret.length} characters — use at least 16 characters for security`);
}

const server = app.listen(port, () => {
  logger.info(`RAG Chatbot backend running on port ${port} (${config.server.env})`);
});

// Graceful shutdown
function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
