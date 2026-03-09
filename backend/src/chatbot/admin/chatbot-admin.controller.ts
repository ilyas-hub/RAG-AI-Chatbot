/**
 * Chatbot Admin Controller — HTTP handlers for admin endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { parse } from 'valibot';
import { chatbotAdminService } from './chatbot-admin.service';
import {
  CreateFaqSchema,
  UpdateFaqSchema,
  CreateKnowledgeBaseSchema,
  UpdateKnowledgeBaseSchema,
  UpdateChatbotConfigSchema,
  UploadDocumentSchema,
} from '../chatbot.validation';
import { success } from '@/shared/utils/response';

export class ChatbotAdminController {
  // ============================================================================
  // Knowledge Bases
  // ============================================================================

  listKnowledgeBases = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const knowledgeBases = await chatbotAdminService.listKnowledgeBases();
      res.json(success(knowledgeBases));
    } catch (error) {
      next(error);
    }
  };

  createKnowledgeBase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = parse(CreateKnowledgeBaseSchema, req.body);
      const kb = await chatbotAdminService.createKnowledgeBase(dto);
      res.status(201).json(success(kb));
    } catch (error) {
      next(error);
    }
  };

  updateKnowledgeBase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const dto = parse(UpdateKnowledgeBaseSchema, req.body);
      const kb = await chatbotAdminService.updateKnowledgeBase(id, dto);
      res.json(success(kb));
    } catch (error) {
      next(error);
    }
  };

  deleteKnowledgeBase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await chatbotAdminService.deleteKnowledgeBase(id);
      res.json(success({ message: 'Knowledge base deleted' }));
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // Documents
  // ============================================================================

  uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const knowledgeBaseId = req.params.id as string;
      const dto = parse(UploadDocumentSchema, req.body);
      const doc = await chatbotAdminService.uploadDocument(knowledgeBaseId, dto);
      res.status(201).json(success(doc));
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await chatbotAdminService.deleteDocument(id);
      res.json(success({ message: 'Document deleted' }));
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // FAQ Management
  // ============================================================================

  listFaqs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = req.query.category as string | undefined;
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await chatbotAdminService.listFaqs({
        category,
        isActive,
        page,
        limit,
      });
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  };

  createFaq = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = parse(CreateFaqSchema, req.body);
      const faq = await chatbotAdminService.createFaq(dto);
      res.status(201).json(success(faq));
    } catch (error) {
      next(error);
    }
  };

  updateFaq = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const dto = parse(UpdateFaqSchema, req.body);
      const faq = await chatbotAdminService.updateFaq(id, dto);
      res.json(success(faq));
    } catch (error) {
      next(error);
    }
  };

  deleteFaq = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await chatbotAdminService.deleteFaq(id);
      res.json(success({ message: 'FAQ deleted' }));
    } catch (error) {
      next(error);
    }
  };

  syncFaqs = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await chatbotAdminService.syncAllFaqs();
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // Config
  // ============================================================================

  getFullConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await chatbotAdminService.getFullConfig();
      res.json(success(config));
    } catch (error) {
      next(error);
    }
  };

  updateConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = parse(UpdateChatbotConfigSchema, req.body);
      const config = await chatbotAdminService.updateConfig(dto);
      res.json(success(config));
    } catch (error) {
      next(error);
    }
  };

  // ============================================================================
  // Analytics & Re-index
  // ============================================================================

  getAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const analytics = await chatbotAdminService.getAnalytics();
      res.json(success(analytics));
    } catch (error) {
      next(error);
    }
  };

  reindex = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await chatbotAdminService.reindexAll();
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  };
}

export const chatbotAdminController = new ChatbotAdminController();
