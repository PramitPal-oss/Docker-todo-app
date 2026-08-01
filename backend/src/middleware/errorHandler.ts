import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { AppError } from './AppError';

// 404 handler - place after all routes
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404);
  next(error);
}

// Central error handler - place last in middleware chain
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  logger.error(message, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    message,
  });
}
