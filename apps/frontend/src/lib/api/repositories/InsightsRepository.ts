/**
 * Insights Repository
 * Handles spending summaries and AI advice with caching
 */

import { BaseRepository } from './BaseRepository';
import { getApiUrl, ApiError } from '../client';
import type { AIAdviceResponse } from '@casha/shared';

// Cache TTL: 2 minutes
const INSIGHTS_CACHE_TTL = 2 * 60 * 1000;

interface SpendingSummary {
  totalSpent: number;
  budgetAmount: number | null;
  remaining: number | null;
  percentage: number | null;
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
}

interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  count: number;
}

interface DailySpending {
  date: string;
  amount: number;
  count: number;
}

interface SpendingTrend {
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface AIAdviceRequestWithData {
  period: 'week' | 'month';
  includeCategories?: boolean;
  includeTrends?: boolean;
  spendingData?: {
    totalSpent: number;
    totalBudget: number;
    categorySpending: Array<{ name: string; amount: number; percentage: number }>;
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
    currency?: string;
    currencySymbol?: string;
  };
}

class InsightsRepositoryClass extends BaseRepository {
  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get spending summary (with caching)
   */
  async getSpendingSummary(period: 'week' | 'month' = 'month'): Promise<SpendingSummary> {
    const query = this.buildQueryString({ period });
    return this.getWithCache<SpendingSummary>(
      `/api/insights/summary${query}`,
      `insights:summary:${period}`,
      INSIGHTS_CACHE_TTL
    );
  }

  /**
   * Get category spending breakdown (with caching)
   */
  async getCategorySpending(period: 'week' | 'month' = 'month'): Promise<CategorySpending[]> {
    const query = this.buildQueryString({ period });
    return this.getWithCache<CategorySpending[]>(
      `/api/insights/category-spending${query}`,
      `insights:category-spending:${period}`,
      INSIGHTS_CACHE_TTL
    );
  }

  /**
   * Get daily spending breakdown (with caching)
   */
  async getDailySpending(period: 'week' | 'month' = 'month'): Promise<DailySpending[]> {
    const query = this.buildQueryString({ period });
    return this.getWithCache<DailySpending[]>(
      `/api/insights/daily-spending${query}`,
      `insights:daily-spending:${period}`,
      INSIGHTS_CACHE_TTL
    );
  }

  /**
   * Get spending trends (with caching)
   */
  async getSpendingTrends(period: 'week' | 'month' = 'month'): Promise<SpendingTrend> {
    const query = this.buildQueryString({ period });
    return this.getWithCache<SpendingTrend>(
      `/api/insights/trends${query}`,
      `insights:trends:${period}`,
      INSIGHTS_CACHE_TTL
    );
  }

  /**
   * Get AI-powered advice and recommendations
   */
  async getAIAdvice(request: AIAdviceRequestWithData): Promise<AIAdviceResponse> {
    const token = this.getAuthToken();

    if (!token) {
      throw new ApiError('Not authenticated', 401);
    }

    const response = await fetch(`${getApiUrl()}/api/insights/ai-advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError('Session expired', 401, 'Please log in again');
      }
      throw new ApiError('Failed to get AI advice', response.status);
    }

    return response.json();
  }
}

// Export singleton instance
export const insightsRepository = new InsightsRepositoryClass();
