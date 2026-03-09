/**
 * Chatbot feature types
 */

export interface ChatConversation {
  id: string;
  sessionId: string;
  title?: string | null;
  source: string;
  isActive: boolean;
  startedAt: string;
  endedAt?: string | null;
  messageCount?: number;
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  isHelpful?: boolean | null;
  feedbackText?: string | null;
  modelUsed?: string | null;
  latencyMs?: number | null;
  createdAt: string;
}

export interface ChatbotConfig {
  isEnabled: boolean;
  welcomeMessage: string;
  enableFeedback: boolean;
  allowAnonymous: boolean;
}

export interface SendMessageInput {
  conversationId?: string;
  message: string;
  source?: 'web' | 'widget' | 'api' | 'wordpress';
}

export interface CreateConversationInput {
  source?: 'web' | 'widget' | 'api' | 'wordpress';
  metadata?: Record<string, unknown>;
}

export interface SubmitFeedbackInput {
  messageId: string;
  isHelpful: boolean;
  feedbackText?: string;
}

export interface ConversationsListResponse {
  conversations: ChatConversation[];
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
