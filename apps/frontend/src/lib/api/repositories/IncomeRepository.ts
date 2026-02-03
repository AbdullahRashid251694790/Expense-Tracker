/**
 * Income Repository
 * Handles income source operations with caching
 */

import { BaseRepository } from './BaseRepository';
import type {
  IncomeSource,
  CreateIncomeSourceRequest,
  UpdateIncomeSourceRequest,
} from '@casha/shared';

// Cache TTL: 5 minutes (income sources rarely change)
const INCOME_CACHE_TTL = 5 * 60 * 1000;

class IncomeRepositoryClass extends BaseRepository {
  /**
   * Get all income sources (with caching)
   */
  async getIncomeSources(): Promise<IncomeSource[]> {
    return this.getWithCache<IncomeSource[]>(
      '/api/income-sources',
      'income-sources:all',
      INCOME_CACHE_TTL
    );
  }

  /**
   * Get all income sources without caching (for fresh data)
   */
  async getIncomeSourcesFresh(): Promise<IncomeSource[]> {
    return this.get<IncomeSource[]>('/api/income-sources');
  }

  /**
   * Get a single income source by ID (with caching)
   */
  async getIncomeSource(id: string): Promise<IncomeSource> {
    return this.getWithCache<IncomeSource>(
      `/api/income-sources/${id}`,
      `income-source:${id}`,
      INCOME_CACHE_TTL
    );
  }

  /**
   * Create a new income source
   */
  async createIncomeSource(data: CreateIncomeSourceRequest): Promise<IncomeSource> {
    const result = await this.post<IncomeSource>('/api/income-sources', data);
    await this.invalidateCache(['income-sources:*', 'income-source:*']);
    return result;
  }

  /**
   * Update an existing income source
   */
  async updateIncomeSource(id: string, data: UpdateIncomeSourceRequest): Promise<IncomeSource> {
    const result = await this.put<IncomeSource>(`/api/income-sources/${id}`, data);
    await this.invalidateCache(['income-sources:*', `income-source:${id}`]);
    return result;
  }

  /**
   * Delete an income source
   */
  async deleteIncomeSource(id: string): Promise<void> {
    await this.delete(`/api/income-sources/${id}`);
    await this.invalidateCache(['income-sources:*', `income-source:${id}`]);
  }

  /**
   * Get total monthly income
   */
  async getTotalMonthlyIncome(): Promise<{ totalMonthlyIncome: number }> {
    return this.getWithCache<{ totalMonthlyIncome: number }>(
      '/api/income-sources/total-monthly',
      'income-sources:total-monthly',
      INCOME_CACHE_TTL
    );
  }
}

// Export singleton instance
export const incomeRepository = new IncomeRepositoryClass();
