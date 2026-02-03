/**
 * Authentication Repository
 * Handles user authentication operations
 */

import { BaseRepository } from './BaseRepository';
import type {
  User,
  CreateUserRequest,
  LoginRequest,
  LoginResponse,
} from '@casha/shared';

class AuthRepositoryClass extends BaseRepository {
  /**
   * Register a new user
   */
  async register(data: CreateUserRequest): Promise<User> {
    return this.post<User>('/api/auth/register', data);
  }

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/api/auth/login', data);

    // Store token in localStorage
    if (response.accessToken) {
      localStorage.setItem('accessToken', response.accessToken);
    }

    return response;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await this.post<void>('/api/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    return this.get<User>('/api/auth/me');
  }

  /**
   * Update user profile
   */
  async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    return this.put<User>('/api/auth/profile', data);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Delete user account and all associated data
   */
  async deleteAccount(): Promise<void> {
    await this.delete('/api/users/account');
    localStorage.removeItem('accessToken');
  }
}

// Export singleton instance
export const authRepository = new AuthRepositoryClass();
