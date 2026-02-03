/**
 * Shared Types - Barrel Export
 * Central export for all shared type definitions
 */

export * from './user';
export * from './category';
export * from './expense';
export * from './budget';
export * from './income';
export * from './insights';
export * from './chat';

// Common utility types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  detail?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
