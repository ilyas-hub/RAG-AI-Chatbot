/**
 * Chatbot DB Adapter — Uses metadata (global) database
 *
 * The chatbot uses the platform-wide metadata database, NOT per-tenant DBs.
 * All FAQ content, knowledge bases, config, and conversations are global.
 */

import { getMetadataPrisma } from '@/database/connection/metadata-prisma';
import type { PrismaClient } from '@prisma/client-metadata';

export class ChatbotDbAdapter {
  /**
   * Get the metadata Prisma client for chatbot operations.
   * No organizationId needed — chatbot data is global.
   */
  getClient(): PrismaClient {
    return getMetadataPrisma();
  }
}

export const chatbotDb = new ChatbotDbAdapter();
