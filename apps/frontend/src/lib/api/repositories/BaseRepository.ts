/**
 * Base Repository
 * DRY pattern for all API calls
 * Handles HTTP methods, error handling, response parsing, and caching
 *
 * SOLID-S: Handles only HTTP communication
 * SOLID-O: Extended by specific repositories
 */

import { getApiUrl, ApiError } from '../client';
import { cacheManager } from '@/lib/cache';
import { Storage } from '@/lib/storage/storage';

export class BaseRepository {
  protected baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || getApiUrl();
  }

  /**
   * Get auth token from storage (sync for immediate access)
   */
  protected getAuthToken(): string | null {
    return Storage.getItemSync('accessToken');
  }

  /**
   * Main request method with error handling and timeout
   */
  protected async request<T>(
    endpoint: string,
    options?: RequestInit,
    timeoutMs = 30000
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const token = this.getAuthToken();

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        Storage.removeItemSync('accessToken');
        window.dispatchEvent(new Event('auth:logout'));
        throw new ApiError('Session expired', 401, 'Please log in again');
      }

      // Handle non-OK responses
      if (!response.ok) {
        let errorDetail = `Request failed with status ${response.status}`;

        try {
          const errorData = await response.json();
          errorDetail = errorData.message || errorData.detail || errorDetail;
        } catch {
          // JSON parsing failed, use default message
        }

        throw new ApiError(errorDetail, response.status, errorDetail);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(
          'Request timeout',
          0,
          `Request to ${endpoint} timed out`
        );
      }

      // Network errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        'Failed to connect to API'
      );
    }
  }

  /**
   * GET request
   */
  protected async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  protected async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  protected async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  protected async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  protected async delete(endpoint: string): Promise<void> {
    await this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Build query string from params
   */
  protected buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * GET with cache-first strategy
   * Returns cached data if available, then fetches fresh data in background
   */
  protected async getWithCache<T>(
    endpoint: string,
    cacheKey: string,
    ttlMs: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    // Try cache first
    const cached = await cacheManager.get<T>(cacheKey);
    if (cached) {
      // Return cached data immediately, refresh in background
      this.get<T>(endpoint)
        .then((data) => cacheManager.set(cacheKey, data, ttlMs))
        .catch(() => {}); // Silent background refresh
      return cached;
    }

    // No cache, fetch from API
    const data = await this.get<T>(endpoint);
    await cacheManager.set(cacheKey, data, ttlMs);
    return data;
  }

  /**
   * Invalidate cache after mutation
   */
  protected async invalidateCache(patterns: string[]): Promise<void> {
    await Promise.all(patterns.map((p) => cacheManager.invalidate(p)));
  }
}
