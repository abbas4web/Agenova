import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global Express error handler.
 * Must have 4 parameters for Express to recognise it as an error handler.
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.isOperational
    ? err.message
    : 'An unexpected error occurred. Please try again.';

  logger.error(
    {
      err,
      method: req.method,
      url: req.url,
      statusCode,
    },
    'Request error'
  );

  res.status(statusCode).json({
    error: message,
    ...(env.isDev && !err.isOperational ? { details: err.message, stack: err.stack } : {}),
  });
}

/**
 * Create an operational error (safe to expose message to client).
 */
export function createError(message: string, statusCode = 400): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}

/**
 * 404 handler — catches any unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
}
