import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import chatbotRoutes from '@/chatbot/chatbot.routes';
import { config } from '@/config';
import { errorHandler } from '@/shared/middleware/error-handler.middleware';

const app = express();

app.use(helmet());
app.use(cors({
  exposedHeaders: ['X-Admin-Secret'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret'],
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      openrouter: config.openrouter.isConfigured,
      pinecone: config.pinecone.isConfigured,
      redis: config.redis.isConfigured,
      database: !!config.database.metadataUrl,
    },
  });
});

// Chatbot routes
app.use('/chatbot', chatbotRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
