import { config } from '@/config';
import { logger } from '@/shared/utils/logger';
import app from './app';

const port = config.server.port;

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
