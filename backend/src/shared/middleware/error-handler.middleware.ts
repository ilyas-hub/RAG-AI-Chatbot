import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/utils/errors';
import { logger } from '@/shared/utils/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Valibot validation errors
  if (err.name === 'ValiError') {
    const issues = (err as any).issues;
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: issues?.map((i: any) => ({
        path: i.path?.map((p: any) => p.key).join('.'),
        message: i.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  logger.error({ event: 'unhandled_error', error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
