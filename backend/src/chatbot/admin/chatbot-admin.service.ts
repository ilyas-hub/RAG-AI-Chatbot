/**
 * Chatbot Admin Service — Business logic for admin operations
 *
 * Handles:
 * - FAQ CRUD + trigger embedding
 * - Knowledge base management
 * - Document upload
 * - Config management
 * - Analytics
 */

import { v4 as uuidv4 } from 'uuid';
import { chatbotDb } from '../adapters/database.adapter';
import { invalidateApiKeyConfigCache } from '../adapters/auth.adapter';
import { invalidateChatbotConfigCache } from '../chatbot.service';
import { ingestionService } from '../services/ingestion.service';
import { config } from '@/config';
import { logger } from '@/shared/utils/logger';
import { NotFoundError, ConflictError } from '@/shared/utils/errors';
import type {
  CreateFaqDTO,
  UpdateFaqDTO,
  CreateKnowledgeBaseDTO,
  UpdateKnowledgeBaseDTO,
  UpdateChatbotConfigDTO,
  UploadDocumentDTO,
  AnalyticsResponse,
} from '../chatbot.types';

export class ChatbotAdminService {
  // ============================================================================
  // Knowledge Base Management
  // ============================================================================

  async listKnowledgeBases() {
    const prisma = chatbotDb.getClient();
    return prisma.knowledgeBase.findMany({
      include: {
        _count: { select: { documents: true, faqContents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createKnowledgeBase(dto: CreateKnowledgeBaseDTO) {
    const prisma = chatbotDb.getClient();

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await prisma.knowledgeBase.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const kb = await prisma.knowledgeBase.create({
      data: {
        name: dto.name,
        description: dto.description,
        pineconeNamespace: 'global',
        embeddingModel: dto.embeddingModel || config.chatbot.embeddingModel,
        isDefault: dto.isDefault || false,
      },
    });

    logger.created('KnowledgeBase', kb.id, {});
    return kb;
  }

  async updateKnowledgeBase(id: string, dto: UpdateKnowledgeBaseDTO) {
    const prisma = chatbotDb.getClient();

    const existing = await prisma.knowledgeBase.findFirst({
      where: { id },
    });
    if (!existing) throw new NotFoundError('Knowledge base not found');

    if (dto.isDefault) {
      await prisma.knowledgeBase.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: dto,
    });

    logger.updated('KnowledgeBase', id, {});
    return updated;
  }

  async deleteKnowledgeBase(id: string) {
    const prisma = chatbotDb.getClient();

    const existing = await prisma.knowledgeBase.findFirst({
      where: { id },
    });
    if (!existing) throw new NotFoundError('Knowledge base not found');

    // Clean up Pinecone vectors before deleting DB records
    const [documents, faqs] = await Promise.all([
      prisma.knowledgeDocument.findMany({
        where: { knowledgeBaseId: id },
        select: { id: true, chunkCount: true },
      }),
      prisma.faqContent.findMany({
        where: { knowledgeBaseId: id },
        select: { pineconeVectorId: true },
      }),
    ]);

    // Remove document vectors
    for (const doc of documents) {
      if (doc.chunkCount > 0) {
        try {
          await ingestionService.removeDocumentVectors(doc.id, doc.chunkCount);
        } catch (err) {
          logger.chatbotError('kb_delete_vector_cleanup', (err as Error).message, {
            documentId: doc.id,
          });
        }
      }
    }

    // Remove FAQ vectors
    const faqVectorIds = faqs
      .map((f) => f.pineconeVectorId)
      .filter((id): id is string => !!id);
    if (faqVectorIds.length > 0) {
      try {
        const pinecone = await import('@/providers/pinecone/index.js');
        await pinecone.deleteVectors('global', faqVectorIds);
      } catch (err) {
        logger.chatbotError('kb_delete_faq_vector_cleanup', (err as Error).message, {
          knowledgeBaseId: id,
        });
      }
    }

    await prisma.knowledgeBase.delete({ where: { id } });
    logger.deleted('KnowledgeBase', id, {
      documentsRemoved: documents.length,
      faqVectorsRemoved: faqVectorIds.length,
    });
  }

  // ============================================================================
  // Document Management
  // ============================================================================

  async uploadDocument(knowledgeBaseId: string, dto: UploadDocumentDTO) {
    const prisma = chatbotDb.getClient();

    const kb = await prisma.knowledgeBase.findFirst({
      where: { id: knowledgeBaseId },
    });
    if (!kb) throw new NotFoundError('Knowledge base not found');

    const contentHash = ingestionService.hashContent(dto.content);

    const doc = await prisma.knowledgeDocument.create({
      data: {
        knowledgeBaseId,
        title: dto.title,
        sourceType: dto.sourceType,
        sourceFileKey: dto.sourceFileKey,
        content: dto.content,
        contentHash,
      },
    });

    // Trigger async ingestion (fire and forget)
    ingestionService
      .ingestDocument(doc.id, dto.content, {
        title: dto.title,
        knowledgeBaseId,
      })
      .catch((err) => {
        logger.chatbotError('document_ingestion_failed', err.message, {
          documentId: doc.id,
        });
      });

    logger.created('KnowledgeDocument', doc.id, { knowledgeBaseId });
    return doc;
  }

  async deleteDocument(documentId: string) {
    const prisma = chatbotDb.getClient();

    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundError('Document not found');

    // Remove vectors from Pinecone
    if (doc.chunkCount > 0) {
      await ingestionService.removeDocumentVectors(documentId, doc.chunkCount);
    }

    await prisma.knowledgeDocument.delete({ where: { id: documentId } });
    logger.deleted('KnowledgeDocument', documentId, {});
  }

  // ============================================================================
  // FAQ Management
  // ============================================================================

  async listFaqs(
    options: { category?: string; isActive?: boolean; page?: number; limit?: number } = {}
  ) {
    const prisma = chatbotDb.getClient();
    const { category, isActive, page = 1, limit = 50 } = options;

    const where: any = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    const [faqs, total] = await Promise.all([
      prisma.faqContent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.faqContent.count({ where }),
    ]);

    return { faqs, total };
  }

  async createFaq(dto: CreateFaqDTO) {
    const prisma = chatbotDb.getClient();

    const faq = await prisma.faqContent.create({
      data: {
        category: dto.category,
        question: dto.question,
        answer: dto.answer,
        keywords: dto.keywords || [],
        knowledgeBaseId: dto.knowledgeBaseId,
        embeddingStatus: 'PENDING',
      },
    });

    // Trigger async embedding (fire and forget)
    ingestionService
      .ingestFaq(faq.id, dto.question, dto.answer, {
        category: dto.category,
        knowledgeBaseId: dto.knowledgeBaseId,
      })
      .catch((err) => {
        logger.chatbotError('faq_embedding_failed', err.message, {
          faqId: faq.id,
        });
      });

    logger.created('FaqContent', faq.id, {});
    return faq;
  }

  async updateFaq(faqId: string, dto: UpdateFaqDTO) {
    const prisma = chatbotDb.getClient();

    const existing = await prisma.faqContent.findFirst({
      where: { id: faqId },
    });
    if (!existing) throw new NotFoundError('FAQ not found');

    const updated = await prisma.faqContent.update({
      where: { id: faqId },
      data: {
        ...dto,
        // If question or answer changed, re-embed
        embeddingStatus: (dto.question || dto.answer) ? 'PENDING' : undefined,
      },
    });

    // Re-embed if content changed
    if (dto.question || dto.answer) {
      const q = dto.question || existing.question;
      const a = dto.answer || existing.answer;

      // Remove old vector first
      if (existing.pineconeVectorId) {
        await ingestionService.removeFaqVector(existing.pineconeVectorId);
      }

      ingestionService
        .ingestFaq(faqId, q, a, { category: updated.category })
        .catch((err) => {
          logger.chatbotError('faq_re_embedding_failed', err.message, {
            faqId,
          });
        });
    }

    logger.updated('FaqContent', faqId, {});
    return updated;
  }

  async deleteFaq(faqId: string) {
    const prisma = chatbotDb.getClient();

    const existing = await prisma.faqContent.findFirst({
      where: { id: faqId },
    });
    if (!existing) throw new NotFoundError('FAQ not found');

    // Remove vector from Pinecone
    if (existing.pineconeVectorId) {
      await ingestionService.removeFaqVector(existing.pineconeVectorId);
    }

    await prisma.faqContent.delete({ where: { id: faqId } });
    logger.deleted('FaqContent', faqId, {});
  }

  /**
   * Sync all FAQs — re-embed all active FAQs with concurrency limit
   */
  async syncAllFaqs(): Promise<{ synced: number }> {
    const prisma = chatbotDb.getClient();
    const CONCURRENCY = 5;

    const faqs = await prisma.faqContent.findMany({
      where: { isActive: true },
    });

    let synced = 0;

    // Process in batches of CONCURRENCY
    for (let i = 0; i < faqs.length; i += CONCURRENCY) {
      const batch = faqs.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((faq) =>
          ingestionService.ingestFaq(faq.id, faq.question, faq.answer, {
            category: faq.category,
            knowledgeBaseId: faq.knowledgeBaseId || undefined,
          })
        )
      );

      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled') {
          synced++;
        } else {
          const err = (results[j] as PromiseRejectedResult).reason;
          logger.chatbotError('faq_sync_failed', (err as Error).message, {
            faqId: batch[j].id,
          });
        }
      }
    }

    logger.chatbot('faq_sync_completed', 'global', { synced, total: faqs.length });
    return { synced };
  }

  // ============================================================================
  // Config Management
  // ============================================================================

  async getFullConfig() {
    const prisma = chatbotDb.getClient();
    return prisma.chatbotConfig.findUnique({
      where: { id: 'default' },
    });
  }

  async updateConfig(dto: UpdateChatbotConfigDTO) {
    const prisma = chatbotDb.getClient();

    const updated = await prisma.chatbotConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...dto,
      },
      update: dto,
    });

    invalidateApiKeyConfigCache();
    invalidateChatbotConfigCache();
    logger.chatbot('config_updated', 'global');
    return updated;
  }

  /**
   * Generate a new widget API key
   */
  async generateWidgetApiKey(): Promise<string> {
    const prisma = chatbotDb.getClient();
    const apiKey = `widget_pk_${uuidv4().replace(/-/g, '')}`;

    await prisma.chatbotConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', widgetApiKey: apiKey },
      update: { widgetApiKey: apiKey },
    });

    invalidateApiKeyConfigCache();
    logger.chatbot('widget_api_key_generated', 'global');
    return apiKey;
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  async getAnalytics(): Promise<AnalyticsResponse> {
    const prisma = chatbotDb.getClient();

    const [totalConversations, totalMessages, feedbackStats, categoryStats] = await Promise.all([
      prisma.chatConversation.count(),
      prisma.chatMessage.count(),
      prisma.chatMessage.groupBy({
        by: ['isHelpful'],
        where: {
          isHelpful: { not: null },
        },
        _count: true,
      }),
      prisma.faqContent.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: { _all: true },
        orderBy: { _count: { category: 'desc' } },
        take: 10,
      }),
    ]);

    const helpful = feedbackStats.find((f) => f.isHelpful === true)?._count || 0;
    const notHelpful = feedbackStats.find((f) => f.isHelpful === false)?._count || 0;

    return {
      totalConversations,
      totalMessages,
      avgMessagesPerConversation:
        totalConversations > 0
          ? Math.round((totalMessages / totalConversations) * 10) / 10
          : 0,
      feedbackStats: {
        helpful,
        notHelpful,
        total: helpful + notHelpful,
      },
      topCategories: categoryStats.map((c) => ({
        category: c.category,
        count: c._count._all,
      })),
    };
  }

  /**
   * Full re-index: re-embed all FAQs and documents
   */
  async reindexAll(): Promise<{ faqs: number; documents: number }> {
    const CONCURRENCY = 3;
    const { synced: faqs } = await this.syncAllFaqs();

    const prisma = chatbotDb.getClient();
    const documents = await prisma.knowledgeDocument.findMany({
      where: { isActive: true },
    });

    let docCount = 0;
    for (let i = 0; i < documents.length; i += CONCURRENCY) {
      const batch = documents.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((doc) =>
          ingestionService.ingestDocument(doc.id, doc.content, {
            title: doc.title,
            knowledgeBaseId: doc.knowledgeBaseId,
          })
        )
      );

      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled') {
          docCount++;
        } else {
          const err = (results[j] as PromiseRejectedResult).reason;
          logger.chatbotError('document_reindex_failed', (err as Error).message, {
            documentId: batch[j].id,
          });
        }
      }
    }

    logger.chatbot('reindex_completed', 'global', { faqs, documents: docCount });
    return { faqs, documents: docCount };
  }
}

export const chatbotAdminService = new ChatbotAdminService();
