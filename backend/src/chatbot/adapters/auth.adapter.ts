/**
 * Auth Adapter — Extractability seam for authentication
 *
 * PERMISSION MODEL (simplified — 2 logical roles):
 *
 * ┌─────────────────┬──────────────┬─────────────────────────────────────────┐
 * │ Chatbot Role     │ Maps From    │ Access                                  │
 * ├─────────────────┼──────────────┼─────────────────────────────────────────┤
 * │ Admin            │ Super Admin  │ 16 admin + 7 user endpoints (23 total)  │
 * │ User             │ All others   │ 7 user endpoints (chat, convos, etc.)   │
 * │ External         │ API key      │ 3 external endpoints (widget chat)      │
 * └─────────────────┴──────────────┴─────────────────────────────────────────┘
 *
 * Admin routes: requireSuperAdmin() (Global Super Admin from unified-auth)
 * User routes:  requireApiAuth() (any authenticated user)
 * External:     requireApiKeyAuth() (API key — global singleton config)
 */

import { timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/shared/utils/errors';
import { chatbotDb } from './database.adapter';
import { logger } from '@/shared/utils/logger';

/**
 * In-memory cache for chatbot config used in API key auth.
 * Avoids a DB query on every external widget request.
 */
let cachedConfig: { widgetApiKey: string | null; isEnabled: boolean } | null = null;
let cachedConfigAt = 0;
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCachedApiKeyConfig() {
  const now = Date.now();
  if (cachedConfig && now - cachedConfigAt < CONFIG_CACHE_TTL_MS) {
    return cachedConfig;
  }

  const prisma = chatbotDb.getClient();
  const config = await prisma.chatbotConfig.findUnique({
    where: { id: 'default' },
    select: { widgetApiKey: true, isEnabled: true },
  });

  cachedConfig = config
    ? { widgetApiKey: config.widgetApiKey, isEnabled: config.isEnabled }
    : null;
  cachedConfigAt = now;
  return cachedConfig;
}

/**
 * Invalidate the cached config (call after config updates).
 */
export function invalidateApiKeyConfigCache(): void {
  cachedConfig = null;
  cachedConfigAt = 0;
}

/**
 * Constant-time string comparison to prevent timing attacks on API keys.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Lengths differ — still do a comparison against self to keep constant time
    timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Middleware: Authenticate via API key header for external widget requests.
 * Validates x-api-key against global ChatbotConfig.widgetApiKey.
 */
export function requireApiKeyAuth() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKey = req.headers['x-api-key'] as string | undefined;

      if (!apiKey) {
        throw new UnauthorizedError('Missing x-api-key header');
      }

      const chatbotConfig = await getCachedApiKeyConfig();

      if (!chatbotConfig || !chatbotConfig.widgetApiKey || !safeCompare(chatbotConfig.widgetApiKey, apiKey)) {
        throw new UnauthorizedError('Invalid API key');
      }

      if (!chatbotConfig.isEnabled) {
        throw new UnauthorizedError('Chatbot is not enabled');
      }

      // Attach anonymous user context to request
      (req as any).user = {
        id: 'anonymous',
        scopes: [],
        applicationRoles: [],
        isGlobalSuperAdmin: false,
        isExternal: true,
      };

      logger.auth('External widget auth', { source: 'api_key' });
      next();
    } catch (error) {
      next(error);
    }
  };
}
