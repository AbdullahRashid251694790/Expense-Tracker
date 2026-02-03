/**
 * Standardized API Errors
 * Custom error classes and factory functions
 */

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error factory functions
 */
export const Errors = {
  /**
   * 404 Not Found
   */
  notFound: (resource: string): ApiError =>
    new ApiError(404, 'NOT_FOUND', `${resource} not found`),

  /**
   * 401 Unauthorized
   */
  unauthorized: (message = 'Unauthorized'): ApiError =>
    new ApiError(401, 'UNAUTHORIZED', message),

  /**
   * 403 Forbidden
   */
  forbidden: (message = 'Access denied'): ApiError =>
    new ApiError(403, 'FORBIDDEN', message),

  /**
   * 400 Bad Request
   */
  badRequest: (message: string, details?: unknown): ApiError =>
    new ApiError(400, 'BAD_REQUEST', message, details),

  /**
   * 409 Conflict
   */
  conflict: (message: string): ApiError =>
    new ApiError(409, 'CONFLICT', message),

  /**
   * 500 Internal Server Error
   */
  internal: (message = 'Internal server error'): ApiError =>
    new ApiError(500, 'INTERNAL_ERROR', message),

  /**
   * 400 Validation Error
   */
  validation: (details: unknown): ApiError =>
    new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', details),

  /**
   * 429 Rate Limit Exceeded
   */
  rateLimit: (): ApiError =>
    new ApiError(
      429,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests, please try again later'
    ),

  /**
   * 422 Unprocessable Entity
   */
  unprocessable: (message: string, details?: unknown): ApiError =>
    new ApiError(422, 'UNPROCESSABLE_ENTITY', message, details),
};
