/** Admin panel types — mirrors backend DTOs */

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  knowledgeBaseId: string | null;
  embeddingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  pineconeVectorId: string | null;
  isActive: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  pineconeNamespace: string | null;
  embeddingModel: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { documents: number; faqContents: number };
}

export interface KnowledgeDocument {
  id: string;
  knowledgeBaseId: string;
  title: string;
  sourceType: 'MANUAL' | 'URL' | 'FILE_UPLOAD';
  content: string;
  chunkCount: number;
  embeddingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotConfig {
  id: string;
  isEnabled: boolean;
  welcomeMessage: string;
  fallbackMessage: string;
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  rateLimitPerMinute: number;
  allowAnonymous: boolean;
  enableFeedback: boolean;
  customInstructions: string | null;
  widgetApiKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
