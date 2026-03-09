/**
 * Chatbot Routes
 *
 * Three route groups:
 * 1. User-facing (any authenticated user) — /chatbot/*
 * 2. Admin (Global Super Admin only) — /chatbot/admin/*
 * 3. External (API key auth) — /chatbot/external/*
 */

import { Router } from 'express';
import { chatbotController } from './chatbot.controller';
import { chatbotAdminController } from './admin/chatbot-admin.controller';
import { requireApiKeyAuth } from './adapters/auth.adapter';
import { requireAdmin } from './admin/admin-auth.middleware';
import { chatRateLimiterRedis } from '@/shared/middleware/rate-limit-redis.middleware';

const router = Router();

// ============================================================================
// User-facing routes (any authenticated user)
// ============================================================================

// POST /chatbot/chat — Send message, receive SSE stream
router.post('/chat', chatRateLimiterRedis, chatbotController.chat);

// POST /chatbot/conversations — Start new conversation
router.post('/conversations', chatbotController.createConversation);

// GET /chatbot/conversations — List user's conversations
router.get('/conversations', chatbotController.listConversations);

// GET /chatbot/conversations/:id/messages — Get message history
router.get('/conversations/:id/messages', chatbotController.getMessages);

// DELETE /chatbot/conversations/:id — End conversation
router.delete('/conversations/:id', chatbotController.endConversation);

// POST /chatbot/feedback — Submit feedback on message
router.post('/feedback', chatbotController.submitFeedback);

// GET /chatbot/config — Get chatbot config (public subset)
router.get('/config', chatbotController.getConfig);

// ============================================================================
// Admin routes (Global Super Admin only)
// ============================================================================

// Knowledge bases
router.get('/admin/knowledge-bases', requireAdmin(), chatbotAdminController.listKnowledgeBases);
router.post('/admin/knowledge-bases', requireAdmin(), chatbotAdminController.createKnowledgeBase);
router.put('/admin/knowledge-bases/:id', requireAdmin(), chatbotAdminController.updateKnowledgeBase);
router.delete('/admin/knowledge-bases/:id', requireAdmin(), chatbotAdminController.deleteKnowledgeBase);

// Documents
router.post('/admin/knowledge-bases/:id/documents', requireAdmin(), chatbotAdminController.uploadDocument);
router.delete('/admin/documents/:id', requireAdmin(), chatbotAdminController.deleteDocument);

// FAQ management
router.get('/admin/faq', requireAdmin(), chatbotAdminController.listFaqs);
router.post('/admin/faq', requireAdmin(), chatbotAdminController.createFaq);
router.put('/admin/faq/:id', requireAdmin(), chatbotAdminController.updateFaq);
router.delete('/admin/faq/:id', requireAdmin(), chatbotAdminController.deleteFaq);
router.post('/admin/faq/sync', requireAdmin(), chatbotAdminController.syncFaqs);

// Config
router.get('/admin/config', requireAdmin(), chatbotAdminController.getFullConfig);
router.put('/admin/config', requireAdmin(), chatbotAdminController.updateConfig);

// Analytics
router.get('/admin/analytics', requireAdmin(), chatbotAdminController.getAnalytics);

// Re-index
router.post('/admin/reindex', requireAdmin(), chatbotAdminController.reindex);

// ============================================================================
// External routes (API key auth for widgets/WordPress)
// ============================================================================

// POST /chatbot/external/chat — Send message (SSE)
router.post('/external/chat', requireApiKeyAuth(), chatRateLimiterRedis, chatbotController.chat);

// POST /chatbot/external/conversations — Start conversation
router.post('/external/conversations', requireApiKeyAuth(), chatbotController.createConversation);

// GET /chatbot/external/config — Get widget config
router.get('/external/config', requireApiKeyAuth(), chatbotController.getConfig);

export default router;
