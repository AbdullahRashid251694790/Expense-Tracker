/**
 * Expenses Repository
 * Handles expense CRUD operations with caching
 */

import { BaseRepository } from './BaseRepository';
import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  ExpenseWithCategory,
  PaginatedResponse,
  PaginationParams,
} from '@casha/shared';

// Cache TTLs
const EXPENSES_CACHE_TTL = 30 * 1000; // 30 seconds
const EXPENSE_CACHE_TTL = 60 * 1000; // 1 minute

class ExpensesRepositoryClass extends BaseRepository {
  private getCacheKey(filters?: ExpenseFilters & PaginationParams): string {
    return `expenses:${JSON.stringify(filters || {})}`;
  }

  /**
   * Get all expenses with optional filters (with caching)
   */
  async getExpenses(
    filters?: ExpenseFilters & PaginationParams
  ): Promise<PaginatedResponse<ExpenseWithCategory>> {
    const query = this.buildQueryString((filters || {}) as Record<string, unknown>);
    const cacheKey = this.getCacheKey(filters);
    return this.getWithCache<PaginatedResponse<ExpenseWithCategory>>(
      `/api/expenses${query}`,
      cacheKey,
      EXPENSES_CACHE_TTL
    );
  }

  /**
   * Get all expenses without caching (for fresh data)
   */
  async getExpensesFresh(
    filters?: ExpenseFilters & PaginationParams
  ): Promise<PaginatedResponse<ExpenseWithCategory>> {
    const query = this.buildQueryString((filters || {}) as Record<string, unknown>);
    return this.get<PaginatedResponse<ExpenseWithCategory>>(`/api/expenses${query}`);
  }

  /**
   * Get a single expense by ID (with caching)
   */
  async getExpense(id: string): Promise<ExpenseWithCategory> {
    return this.getWithCache<ExpenseWithCategory>(
      `/api/expenses/${id}`,
      `expense:${id}`,
      EXPENSE_CACHE_TTL
    );
  }

  /**
   * Create a new expense
   */
  async createExpense(data: CreateExpenseRequest): Promise<Expense> {
    const result = await this.post<Expense>('/api/expenses', data);
    await this.invalidateCache(['expenses:*']);
    return result;
  }

  /**
   * Update an existing expense
   */
  async updateExpense(id: string, data: UpdateExpenseRequest): Promise<Expense> {
    const result = await this.put<Expense>(`/api/expenses/${id}`, data);
    await this.invalidateCache(['expenses:*', `expense:${id}`]);
    return result;
  }

  /**
   * Delete an expense
   */
  async deleteExpense(id: string): Promise<void> {
    await this.delete(`/api/expenses/${id}`);
    await this.invalidateCache(['expenses:*', `expense:${id}`]);
  }

  /**
   * Get recent expenses (last N)
   */
  async getRecentExpenses(limit: number = 5): Promise<ExpenseWithCategory[]> {
    const query = this.buildQueryString({ limit });
    return this.getWithCache<ExpenseWithCategory[]>(
      `/api/expenses/recent${query}`,
      `expenses:recent:${limit}`,
      EXPENSES_CACHE_TTL
    );
  }
}

// Export singleton instance
export const expensesRepository = new ExpensesRepositoryClass();
