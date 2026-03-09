/**
 * Chatbot Orchestration Service
 *
 * Orchestrates the full chat flow:
 * 1. Load global config
 * 2. Retrieve relevant context (RAG)
 * 3. Build system prompt
 * 4. Stream LLM response
 * 5. Save messages to DB
 */

import { v4 as uuidv4 } from 'uuid';
import { chatbotDb } from './adapters/database.adapter';
import { retrievalService } from './services/retrieval.service';
import { promptService } from './services/prompt.service';
import { llmService } from './services/llm.service';
import { config } from '@/config';
import { logger } from '@/shared/utils/logger';
import {
  ChatbotNotEnabledError,
  NotFoundError,
  BadRequestError,
} from '@/shared/utils/errors';
import type {
  ChatContext,
  ChatServiceConfig,
  SendMessageDTO,
  CreateConversationDTO,
  SubmitFeedbackDTO,
  ConversationResponse,
  MessageResponse,
  ChatbotConfigResponse,
} from './chatbot.types';

/**
 * In-memory config cache to avoid DB hits on every chat request.
 */
let configCache: ChatServiceConfig | null = null;
let configCachedAt = 0;
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Call after admin config updates to force refresh on next chat. */
export function invalidateChatbotConfigCache(): void {
  configCache = null;
  configCachedAt = 0;
}

export class ChatbotService {
  /**
   * Load the global chatbot configuration (cached for 5 minutes).
   * Creates a default config if none exists.
   */
  async getOrCreateConfig(): Promise<ChatServiceConfig> {
    const now = Date.now();
    if (configCache && now - configCachedAt < CONFIG_CACHE_TTL_MS) {
      if (!configCache.isEnabled) {
        throw new ChatbotNotEnabledError();
      }
      return configCache;
    }

    const prisma = chatbotDb.getClient();

    let chatbotConfig = await prisma.chatbotConfig.findUnique({
      where: { id: 'default' },
    });

    if (!chatbotConfig) {
      // Auto-create default config on first access
      chatbotConfig = await prisma.chatbotConfig.create({
        data: {
          id: 'default',
          primaryModel: config.chatbot.defaultModel,
          fallbackModel: config.chatbot.fallbackModel,
        },
      });
      logger.chatbot('config_auto_created', 'global');
    }

    const result: ChatServiceConfig = {
      primaryModel: chatbotConfig.primaryModel,
      fallbackModel: chatbotConfig.fallbackModel,
      temperature: chatbotConfig.temperature,
      maxTokens: chatbotConfig.maxTokens,
      welcomeMessage: chatbotConfig.welcomeMessage,
      fallbackMessage: chatbotConfig.fallbackMessage,
      customInstructions: chatbotConfig.customInstructions || undefined,
      isEnabled: chatbotConfig.isEnabled,
    };

    configCache = result;
    configCachedAt = now;

    if (!chatbotConfig.isEnabled) {
      throw new ChatbotNotEnabledError();
    }

    return result;
  }

  /**
   * Main chat flow: retrieve context → build prompt → stream response
   * Returns the AI SDK streamText result for piping to SSE
   */
  async chat(ctx: ChatContext) {
    const startTime = Date.now();
    const { userId, conversationId, message } = ctx;

    // 1. Load config
    const chatConfig = await this.getOrCreateConfig();

    // 2. Save user message to DB
    const prisma = chatbotDb.getClient();
    await prisma.chatMessage.create({
      data: {
        conversationId,
        userId: userId || null,
        role: 'USER',
        content: message,
      },
    });

    // 3. Retrieve relevant context via RAG
    const { chunks } = await retrievalService.retrieve(message);

    // 4. Build system prompt with context
    const { systemPrompt } = await promptService.buildPrompt(
      chunks,
      chatConfig.customInstructions
    );

    // 5. Get conversation history for multi-turn (exclude the user message we just saved)
    const history = await promptService.getConversationHistory(conversationId, 6);
    const historyWithoutCurrent = history.filter(
      (m) => !(m.role === 'USER' && m.content === message)
    );

    // 6. Format messages for LLM
    const messages = llmService.formatMessages(historyWithoutCurrent, message);

    // 7. Stream LLM response
    const result = await llmService.streamResponse(systemPrompt, messages, chatConfig, chatConfig.fallbackMessage);

    // 8. Pre-save assistant message with placeholder content (ensures DB consistency)
    const placeholderMsg = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: '',
        modelUsed: result.modelUsed,
      },
    });

    // 9. After streaming completes — update message with real content
    const latencyMs = Date.now() - startTime;
    result.text.then(async (text) => {
      try {
        const usage = await result.usage;
        await prisma.chatMessage.update({
          where: { id: placeholderMsg.id },
          data: {
            content: text,
            tokenCount: usage?.totalTokens,
            latencyMs,
            retrievedChunks: chunks.length > 0
              ? chunks.map((c) => ({ id: c.id, score: c.score, sourceType: c.sourceType }))
              : undefined,
          },
        });

        // Auto-generate conversation title from first exchange
        const conv = await prisma.chatConversation.findUnique({
          where: { id: conversationId },
          select: { title: true },
        });
        if (!conv?.title) {
          const title = message.length > 60
            ? Array.from(message).slice(0, 57).join('') + '...'
            : message;
          await prisma.chatConversation.update({
            where: { id: conversationId },
            data: { title },
          });
        }
      } catch (err) {
        logger.chatbotError('save_response', (err as Error).message, {
          conversationId,
          messageId: placeholderMsg.id,
        });
      }
    }).catch((err) => {
      logger.chatbotError('stream_completion_error', err instanceof Error ? err.message : String(err), {
        conversationId,
        messageId: placeholderMsg.id,
      });
    });

    return result;
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string | undefined,
    dto: CreateConversationDTO
  ): Promise<ConversationResponse> {
    const prisma = chatbotDb.getClient();
    const sessionId = uuidv4();

    const conversation = await prisma.chatConversation.create({
      data: {
        userId: userId || null,
        sessionId,
        source: dto.source || 'web',
        metadata: (dto.metadata as any) || undefined,
      },
    });

    logger.chatbot('conversation_created', 'global', {
      conversationId: conversation.id,
      source: dto.source,
    });

    return {
      id: conversation.id,
      sessionId: conversation.sessionId,
      title: conversation.title,
      source: conversation.source,
      isActive: conversation.isActive,
      startedAt: conversation.startedAt,
      endedAt: conversation.endedAt,
    };
  }

  /**
   * List conversations for a user
   */
  async listConversations(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ conversations: ConversationResponse[]; total: number }> {
    const prisma = chatbotDb.getClient();

    const [conversations, total] = await Promise.all([
      prisma.chatConversation.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { messages: true } } },
      }),
      prisma.chatConversation.count({
        where: { userId },
      }),
    ]);

    return {
      conversations: conversations.map((c) => ({
        id: c.id,
        sessionId: c.sessionId,
        title: c.title,
        source: c.source,
        isActive: c.isActive,
        startedAt: c.startedAt,
        endedAt: c.endedAt,
        messageCount: c._count.messages,
      })),
      total,
    };
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    userId?: string
  ): Promise<MessageResponse[]> {
    const prisma = chatbotDb.getClient();

    // Verify conversation belongs to user (or is anonymous)
    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        ...(userId ? { userId } : {}),
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      isHelpful: m.isHelpful,
      feedbackText: m.feedbackText,
      modelUsed: m.modelUsed,
      latencyMs: m.latencyMs,
      createdAt: m.createdAt,
    }));
  }

  /**
   * End a conversation
   */
  async endConversation(
    conversationId: string,
    userId?: string
  ): Promise<void> {
    const prisma = chatbotDb.getClient();

    const conversation = await prisma.chatConversation.findFirst({
      where: {
        id: conversationId,
        ...(userId ? { userId } : {}),
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { isActive: false, endedAt: new Date() },
    });

    logger.chatbot('conversation_ended', 'global', { conversationId });
  }

  /**
   * Submit feedback on a message
   */
  async submitFeedback(
    dto: SubmitFeedbackDTO
  ): Promise<void> {
    const prisma = chatbotDb.getClient();

    const message = await prisma.chatMessage.findFirst({
      where: {
        id: dto.messageId,
      },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.role !== 'ASSISTANT') {
      throw new BadRequestError('Feedback can only be submitted for assistant messages');
    }

    await prisma.chatMessage.update({
      where: { id: dto.messageId },
      data: {
        isHelpful: dto.isHelpful,
        feedbackText: dto.feedbackText || null,
      },
    });

    logger.chatbot('feedback_submitted', 'global', {
      messageId: dto.messageId,
      isHelpful: dto.isHelpful,
    });
  }

  /**
   * Get public chatbot config (minimal info)
   */
  async getPublicConfig(): Promise<ChatbotConfigResponse> {
    const prisma = chatbotDb.getClient();

    const chatbotConfig = await prisma.chatbotConfig.findUnique({
      where: { id: 'default' },
    });

    return {
      isEnabled: chatbotConfig?.isEnabled ?? false,
      welcomeMessage: chatbotConfig?.welcomeMessage ?? 'Hello! How can I help you today?',
      enableFeedback: chatbotConfig?.enableFeedback ?? true,
      allowAnonymous: chatbotConfig?.allowAnonymous ?? true,
    };
  }
}

export const chatbotService = new ChatbotService();
