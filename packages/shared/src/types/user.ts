/**
 * User Types
 * Shared user-related type definitions
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'CAD' | 'AUD';

export interface User {
  id: string;
  email: string;
  name: string | null;
  photoURL?: string | null;
  currency?: CurrencyCode;
  createdAt: string;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
