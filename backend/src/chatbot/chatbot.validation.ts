/**
 * Chatbot input validation schemas (Valibot)
 */

import * as v from 'valibot';

// ============================================================================
// User-facing
// ============================================================================

export const SendMessageSchema = v.object({
  conversationId: v.optional(v.pipe(v.string(), v.minLength(1))),
  message: v.pipe(v.string(), v.minLength(1), v.maxLength(4000)),
  source: v.optional(v.picklist(['web', 'widget', 'api', 'wordpress'])),
});

export const CreateConversationSchema = v.object({
  source: v.optional(v.picklist(['web', 'widget', 'api', 'wordpress'])),
  metadata: v.optional(v.record(v.string(), v.unknown())),
});

export const SubmitFeedbackSchema = v.object({
  messageId: v.pipe(v.string(), v.minLength(1)),
  isHelpful: v.boolean(),
  feedbackText: v.optional(v.pipe(v.string(), v.maxLength(1000))),
});

// ============================================================================
// Admin
// ============================================================================

export const CreateFaqSchema = v.object({
  category: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  question: v.pipe(v.string(), v.minLength(1), v.maxLength(2000)),
  answer: v.pipe(v.string(), v.minLength(1), v.maxLength(10000)),
  keywords: v.optional(v.array(v.pipe(v.string(), v.maxLength(100)))),
  knowledgeBaseId: v.optional(v.string()),
});

export const UpdateFaqSchema = v.object({
  category: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  question: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(2000))),
  answer: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(10000))),
  keywords: v.optional(v.array(v.pipe(v.string(), v.maxLength(100)))),
  isActive: v.optional(v.boolean()),
});

export const CreateKnowledgeBaseSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  description: v.optional(v.pipe(v.string(), v.maxLength(2000))),
  embeddingModel: v.optional(v.string()),
  isDefault: v.optional(v.boolean()),
});

export const UpdateKnowledgeBaseSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
  description: v.optional(v.pipe(v.string(), v.maxLength(2000))),
  isActive: v.optional(v.boolean()),
  isDefault: v.optional(v.boolean()),
});

export const UpdateChatbotConfigSchema = v.object({
  isEnabled: v.optional(v.boolean()),
  welcomeMessage: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  fallbackMessage: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  primaryModel: v.optional(v.string()),
  fallbackModel: v.optional(v.string()),
  temperature: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(2))),
  maxTokens: v.optional(v.pipe(v.number(), v.minValue(64), v.maxValue(4096))),
  rateLimitPerMinute: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(1000))),
  allowAnonymous: v.optional(v.boolean()),
  enableFeedback: v.optional(v.boolean()),
  customInstructions: v.optional(v.pipe(v.string(), v.maxLength(5000))),
});

export const UploadDocumentSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(500)),
  content: v.pipe(v.string(), v.minLength(1)),
  sourceType: v.picklist(['MANUAL', 'URL', 'FILE_UPLOAD']),
  sourceFileKey: v.optional(v.string()),
});
