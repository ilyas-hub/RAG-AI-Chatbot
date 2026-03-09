import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { config } from '@/config';
import { UnauthorizedError } from '@/shared/utils/errors';
import { logger } from '@/shared/utils/logger';
import type { UnifiedAuthRequest } from '@/core/types/auth.types';

let jwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    if (!config.auth.jwksUrl) {
      throw new UnauthorizedError('Auth JWKS URL not configured');
    }
    jwks = jose.createRemoteJWKSet(new URL(config.auth.jwksUrl));
  }
  return jwks;
}

async function verifyToken(token: string) {
  const keySet = getJWKS();
  const { payload } = await jose.jwtVerify(token, keySet, {
    issuer: config.auth.issuer || undefined,
    audience: config.auth.audience || undefined,
  });
  return payload;
}

export function requireApiAuth() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or invalid Authorization header');
      }

      const token = authHeader.slice(7);
      const payload = await verifyToken(token);

      const authReq = req as unknown as UnifiedAuthRequest;
      authReq.user = {
        id: (payload.sub as string) || 'unknown',
        scopes: ((payload.scope as string) || '').split(' ').filter(Boolean),
        applicationRoles: (payload.roles as string[]) || [],
        isGlobalSuperAdmin: false,
        isExternal: false,
      };

      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        next(error);
      } else {
        next(new UnauthorizedError('Invalid or expired token'));
      }
    }
  };
}

export function requireSuperAdmin() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // First run standard auth
    await new Promise<void>((resolve) => {
      requireApiAuth()(req, res, (err?: any) => {
        if (err) {
          next(err);
          return;
        }
        resolve();
      });
    });

    const authReq = req as unknown as UnifiedAuthRequest;
    if (!authReq.user) return;

    const isSuperAdmin =
      authReq.user.applicationRoles.includes(config.auth.superAdminRoleId) ||
      authReq.user.applicationRoles.includes('super-admin');

    if (!isSuperAdmin) {
      next(new UnauthorizedError('Super admin access required'));
      return;
    }

    authReq.user.isGlobalSuperAdmin = true;
    logger.auth('Super admin authenticated', { userId: authReq.user.id });
    next();
  };
}
