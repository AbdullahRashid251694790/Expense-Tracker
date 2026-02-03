/**
 * Request Logging Middleware
 * Structured logging for all HTTP requests
 */

import { Request, Response, NextFunction } from 'express';

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  ip: string;
  userAgent: string;
  userId?: number;
  contentLength?: number;
}

type LogLevel = 'info' | 'warn' | 'error';

/**
 * Get log level based on status code
 */
function getLogLevel(statusCode: number): LogLevel {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
}

/**
 * Format log entry as string
 */
function formatLog(entry: LogEntry): string {
  const userPart = entry.userId ? ` user=${entry.userId}` : '';
  const sizePart = entry.contentLength ? ` size=${entry.contentLength}b` : '';

  return `[${entry.timestamp}] ${entry.method} ${entry.path} ${entry.statusCode} ${entry.duration}ms${userPart}${sizePart}`;
}

/**
 * Request logger middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      userId: (req as any).userId,
      contentLength: parseInt(res.get('Content-Length') || '0', 10) || undefined,
    };

    const message = formatLog(logEntry);
    const level = getLogLevel(res.statusCode);

    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      default:
        console.log(message);
    }
  });

  next();
}

/**
 * Skip logging for certain paths (e.g., health checks)
 */
export function requestLoggerWithSkip(skipPaths: string[] = ['/health']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (skipPaths.includes(req.path)) {
      return next();
    }
    return requestLogger(req, res, next);
  };
}
