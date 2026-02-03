/**
 * Budgets Repository
 * Handles budget operations with progress tracking and caching
 */

import { BaseRepository } from './BaseRepository';
import type {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BudgetWithProgress,
} from '@casha/shared';

// Cache TTL: 1 minute (budget progress updates matter)
const BUDGETS_CACHE_TTL = 60 * 1000;

class BudgetsRepositoryClass extends BaseRepository {
  /**
   * Get all budgets with progress (with caching)
   */
  async getBudgets(): Promise<BudgetWithProgress[]> {
    return this.getWithCache<BudgetWithProgress[]>(
      '/api/budgets',
      'budgets:all',
      BUDGETS_CACHE_TTL
    );
  }

  /**
   * Get all budgets without caching (for fresh data)
   */
  async getBudgetsFresh(): Promise<BudgetWithProgress[]> {
    return this.get<BudgetWithProgress[]>('/api/budgets');
  }

  /**
   * Get a single budget by ID (with caching)
   */
  async getBudget(id: string): Promise<BudgetWithProgress> {
    return this.getWithCache<BudgetWithProgress>(
      `/api/budgets/${id}`,
      `budget:${id}`,
      BUDGETS_CACHE_TTL
    );
  }

  /**
   * Create a new budget
   */
  async createBudget(data: CreateBudgetRequest): Promise<Budget> {
    const result = await this.post<Budget>('/api/budgets', data);
    await this.invalidateCache(['budgets:*', 'budget:*']);
    return result;
  }

  /**
   * Update an existing budget
   */
  async updateBudget(id: string, data: UpdateBudgetRequest): Promise<Budget> {
    const result = await this.put<Budget>(`/api/budgets/${id}`, data);
    await this.invalidateCache(['budgets:*', `budget:${id}`]);
    return result;
  }

  /**
   * Delete a budget
   */
  async deleteBudget(id: string): Promise<void> {
    await this.delete(`/api/budgets/${id}`);
    await this.invalidateCache(['budgets:*', `budget:${id}`]);
  }

  /**
   * Get overall budget (categoryId = null) (with caching)
   */
  async getOverallBudget(): Promise<BudgetWithProgress | null> {
    return this.getWithCache<BudgetWithProgress | null>(
      '/api/budgets/overall',
      'budgets:overall',
      BUDGETS_CACHE_TTL
    );
  }
}

// Export singleton instance
export const budgetsRepository = new BudgetsRepositoryClass();
