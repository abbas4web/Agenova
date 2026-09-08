import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Runs after express-validator chains.
 * Collects all validation errors and returns a 422 with a clear message.
 */
export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    res.status(422).json({
      error: 'Validation failed',
      details: messages,
      fields: errors.array().map((e) => ({ field: (e as { path?: string }).path ?? 'unknown', message: e.msg })),
    });
    return;
  }

  next();
}
