/**
 * Admin authentication middleware
 *
 * Supports two auth methods:
 * 1. X-Admin-Secret header (simple shared secret for admin panel)
 * 2. Falls back to requireSuperAdmin() (Logto JWT) if configured
 */

import { timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/shared/utils/errors';
import { requireSuperAdmin } from '@/shared/middleware/unified-auth.middleware';

const ADMIN_SECRET = process.env.CHATBOT_ADMIN_SECRET || 'admin123';

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep constant time, then return false
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function requireAdmin() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const secret = req.headers['x-admin-secret'];

    if (typeof secret === 'string' && safeCompare(secret, ADMIN_SECRET)) {
      return next();
    }

    // If no secret header, try Logto super admin auth
    if (req.headers.authorization) {
      return requireSuperAdmin()(req, res, next) as any;
    }

    next(new UnauthorizedError('Admin authentication required'));
  };
}
