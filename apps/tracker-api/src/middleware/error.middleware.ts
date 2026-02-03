/**
 * Global Error Handler Middleware
 * Standardized error responses for all routes
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/errors';

interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  timestamp: string;
  path: string;
}

/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  const path = req.originalUrl;

  // Log error for debugging
  console.error(`[${timestamp}] Error on ${req.method} ${path}:`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Handle ApiError (our custom errors)
  if (err instanceof ApiError) {
    const response: ErrorResponse = {
      error: err.code,
      message: err.message,
      timestamp,
      path,
    };

    if (err.details) {
      response.details = err.details;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      timestamp,
      path,
    };

    res.status(400).json(response);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const response: ErrorResponse = {
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token',
      timestamp,
      path,
    };

    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const response: ErrorResponse = {
      error: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired',
      timestamp,
      path,
    };

    res.status(401).json(response);
    return;
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    error: 'INTERNAL_ERROR',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    timestamp,
    path,
  };

  res.status(500).json(response);
}

/**
 * 404 Not Found handler
 * For routes that don't exist
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}
