/**
 * Chatbot Controller — HTTP handlers for chat endpoints
 *
 * Handles:
 * - SSE streaming chat responses
 * - Conversation CRUD
 * - Feedback submission
 * - Public config retrieval
 */

import { Request, Response, NextFunction } from 'express';
import { parse } from 'valibot';
import { chatbotService } from './chatbot.service';
import {
  SendMessageSchema,
  CreateConversationSchema,
  SubmitFeedbackSchema,
} from './chatbot.validation';
import { success } from '@/shared/utils/response';
import { logger } from '@/shared/utils/logger';
import { LLMProviderError } from '@/shared/utils/errors';
import type { UnifiedAuthRequest } from '@/core/types/auth.types';

/** Extract user ID from auth (if present) or return 'anonymous' */
function getUserId(req: Request): string {
  const authReq = req as unknown as UnifiedAuthRequest;
  return authReq.user?.id || 'anonymous';
}

export class ChatbotController {
  /**
   * POST /chatbot/chat — Send message, receive SSE stream
   */
  chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);

      // AI SDK's useChat sends { messages: [...] } — extract the last user message
      // v5 uses parts: [{ type: 'text', text: '...' }] instead of content
      const body = req.body;
      if (body.messages && Array.isArray(body.messages) && !body.message) {
        const lastUserMsg = [...body.messages].reverse().find((m: any) => m.role === 'user');
        body.message =
          lastUserMsg?.content ||
          lastUserMsg?.parts
            ?.filter((p: any) => p.type === 'text')
            .map((p: any) => p.text)
            .join('') ||
          '';
      }

      const dto = parse(SendMessageSchema, body);

      // If no conversationId, create one
      let conversationId = dto.conversationId;
      if (!conversationId) {
        const conv = await chatbotService.createConversation(
          userId === 'anonymous' ? undefined : userId,
          { source: dto.source }
        );
        conversationId = conv.id;
      }

      logger.chatbotStream(conversationId, 'pending', {
        userId,
      });

      // Stream LLM response
      const result = await chatbotService.chat({
        userId: userId === 'anonymous' ? undefined : userId,
        conversationId,
        message: dto.message,
        source: dto.source || 'web',
      });

      // Pipe the AI SDK text stream to response
      result.pipeTextStreamToResponse(res);
    } catch (error: any) {
      // If headers already sent (streaming started), we can't send error response
      if (res.headersSent) {
        logger.chatbotError('stream_error_after_headers', error.message);
        res.end();
        return;
      }

      if (error.name === 'ValiError') {
        next(error);
        return;
      }

      // Wrap LLM errors
      if (error.message?.includes('OpenRouter') || error.message?.includes('model')) {
        next(new LLMProviderError(error.message));
        return;
      }

      next(error);
    }
  };

  /**
   * POST /chatbot/conversations — Create new conversation
   */
  createConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);

      const dto = parse(CreateConversationSchema, req.body);
      const conversation = await chatbotService.createConversation(
        userId === 'anonymous' ? undefined : userId,
        dto
      );

      res.status(201).json(success(conversation));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /chatbot/conversations — List user's conversations
   */
  listConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await chatbotService.listConversations(
        userId,
        page,
        limit
      );

      res.json(success(result));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /chatbot/conversations/:id/messages — Get message history
   */
  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;

      const messages = await chatbotService.getMessages(id, userId);

      res.json(success(messages));
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /chatbot/conversations/:id — End conversation
   */
  endConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;

      await chatbotService.endConversation(id, userId);

      res.json(success({ message: 'Conversation ended' }));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /chatbot/feedback — Submit feedback on message
   */
  submitFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = parse(SubmitFeedbackSchema, req.body);
      await chatbotService.submitFeedback(dto);

      res.json(success({ message: 'Feedback submitted' }));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /chatbot/config — Get public chatbot config
   */
  getConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await chatbotService.getPublicConfig();

      res.json(success(config));
    } catch (error) {
      next(error);
    }
  };
}

export const chatbotController = new ChatbotController();
