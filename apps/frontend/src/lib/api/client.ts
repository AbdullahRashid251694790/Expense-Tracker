/**
 * API Client Configuration
 * SOLID-S: Single source of truth for API configuration
 * DRY: Centralized API URL logic
 */

export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
