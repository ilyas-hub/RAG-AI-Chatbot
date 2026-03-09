import { Request, Response, NextFunction } from 'express';
import IORedis from 'ioredis';
import { config } from '@/config';
import { logger } from '@/shared/utils/logger';

let redis: InstanceType<typeof IORedis> | null = null;

function getRedis(): InstanceType<typeof IORedis> | null {
  if (!config.redis.isConfigured) return null;
  if (!redis) {
    redis = new IORedis(config.redis.url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redis.on('error', (err: Error) => {
      logger.error({ event: 'redis_error', error: err.message });
    });
    redis.connect().catch(() => {
      logger.warn('Redis connection failed — rate limiting will be skipped');
    });
  }
  return redis;
}

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 20;

export async function chatRateLimiterRedis(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const client = getRedis();
  if (!client || client.status !== 'ready') {
    // Redis unavailable — skip rate limiting
    next();
    return;
  }

  try {
    const userId = (req as any).user?.id || req.ip || 'anonymous';
    const key = `chatbot:ratelimit:${userId}`;

    const current = await client.incr(key);
    if (current === 1) {
      await client.pexpire(key, WINDOW_MS);
    }

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - current));

    if (current > MAX_REQUESTS) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
      });
      return;
    }

    next();
  } catch {
    // On Redis error, allow the request through
    next();
  }
}
