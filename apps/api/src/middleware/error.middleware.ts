import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;

  const isProduction = env.NODE_ENV === 'production';

  // Log error details safely on the server side
  console.error(`[Error] ${statusCode} - ${err.message}`, isProduction ? '' : err.stack);

  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 && isProduction
        ? 'Internal server error'
        : err.message || 'An unexpected error occurred',
      statusCode,
      ...(isProduction ? {} : { stack: err.stack }),
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
