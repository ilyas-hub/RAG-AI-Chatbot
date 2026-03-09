/**
 * Chatbot module types and DTOs
 */

import type { MessageRole } from '@prisma/client-metadata';

// ============================================================================
// Request DTOs
// ============================================================================

export interface SendMessageDTO {
  conversationId?: string;
  message: string;
  source?: 'web' | 'widget' | 'api' | 'wordpress';
}

export interface CreateConversationDTO {
  source?: 'web' | 'widget' | 'api' | 'wordpress';
  metadata?: Record<string, unknown>;
}

export interface SubmitFeedbackDTO {
  messageId: string;
  isHelpful: boolean;
  feedbackText?: string;
}

// ============================================================================
// Admin DTOs
// ============================================================================

export interface CreateFaqDTO {
  category: string;
  question: string;
  answer: string;
  keywords?: string[];
  knowledgeBaseId?: string;
}

export interface UpdateFaqDTO {
  category?: string;
  question?: string;
  answer?: string;
  keywords?: string[];
  isActive?: boolean;
}

export interface CreateKnowledgeBaseDTO {
  name: string;
  description?: string;
  embeddingModel?: string;
  isDefault?: boolean;
}

export interface UpdateKnowledgeBaseDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateChatbotConfigDTO {
  isEnabled?: boolean;
  welcomeMessage?: string;
  fallbackMessage?: string;
  primaryModel?: string;
  fallbackModel?: string;
  temperature?: number;
  maxTokens?: number;
  rateLimitPerMinute?: number;
  allowAnonymous?: boolean;
  enableFeedback?: boolean;
  customInstructions?: string;
}

export interface UploadDocumentDTO {
  title: string;
  content: string;
  sourceType: 'MANUAL' | 'URL' | 'FILE_UPLOAD';
  sourceFileKey?: string;
}

// ============================================================================
// Service Types
// ============================================================================

export interface ChatContext {
  userId?: string;
  conversationId: string;
  message: string;
  source: string;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  queryEmbedding: number[];
}

export interface RetrievedChunk {
  id: string;
  text: string;
  score: number;
  sourceType: 'faq' | 'document';
  sourceId: string;
  title?: string;
  category?: string;
}

export interface BuiltPrompt {
  systemPrompt: string;
  contextBlock: string;
}

export interface ChatServiceConfig {
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  welcomeMessage: string;
  fallbackMessage: string;
  customInstructions?: string;
  isEnabled: boolean;
}

export interface ConversationMessage {
  role: MessageRole;
  content: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface ConversationResponse {
  id: string;
  sessionId: string;
  title?: string | null;
  source: string;
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date | null;
  messageCount?: number;
}

export interface MessageResponse {
  id: string;
  role: MessageRole;
  content: string;
  isHelpful?: boolean | null;
  feedbackText?: string | null;
  modelUsed?: string | null;
  latencyMs?: number | null;
  createdAt: Date;
}

export interface ChatbotConfigResponse {
  isEnabled: boolean;
  welcomeMessage: string;
  enableFeedback: boolean;
  allowAnonymous: boolean;
}

export interface AnalyticsResponse {
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  feedbackStats: {
    helpful: number;
    notHelpful: number;
    total: number;
  };
  topCategories: Array<{ category: string; count: number }>;
}
