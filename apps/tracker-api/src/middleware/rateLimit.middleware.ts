/**
 * Rate Limiting Middleware
 * In-memory rate limiter for API protection
 * Note: Use Redis for production multi-instance deployments
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
  message?: string;
}

const DEFAULT_OPTIONS: Required<Omit<RateLimitOptions, 'keyGenerator'>> & { keyGenerator: undefined } = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyGenerator: undefined,
  message: 'Too many requests, please try again later',
};

/**
 * Create a rate limiter middleware
 */
export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const store = new Map<string, RateLimitEntry>();

  // Cleanup old entries periodically
  const cleanupInterval = setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of store.entries()) {
        if (entry.resetTime < now) {
          store.delete(key);
        }
      }
    },
    opts.windowMs
  );

  // Prevent interval from keeping process alive
  cleanupInterval.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate key for rate limiting (default: IP address)
    const key = opts.keyGenerator
      ? opts.keyGenerator(req)
      : req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';

    const now = Date.now();
    let entry = store.get(key);

    // Create new entry if doesn't exist or window has passed
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + opts.windowMs,
      };
    }

    entry.count++;
    store.set(key, entry);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', opts.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, opts.maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    // Check if limit exceeded
    if (entry.count > opts.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);

      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: opts.message,
        retryAfter,
      });
    }

    next();
  };
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/**
 * Auth rate limiter - stricter limits for login/register
 * 10 attempts per 15 minutes
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many authentication attempts, please try again later',
});

/**
 * General API rate limiter
 * 1000 requests per minute (generous for development)
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000,
  message: 'Too many requests, please slow down',
});

/**
 * AI endpoint rate limiter - expensive operations
 * 60 requests per minute
 */
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  message: 'AI advice rate limit reached, please try again in a minute',
});

/**
 * Strict rate limiter for sensitive operations
 * 5 requests per minute
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'Rate limit exceeded for sensitive operation',
});
