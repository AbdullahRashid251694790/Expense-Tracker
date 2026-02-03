/**
 * Recommendations Repository
 * Handles daily AI recommendations with caching
 */

import { BaseRepository } from './BaseRepository';
import type { AIInsight } from '@casha/shared';

interface DailyRecommendation {
  userId: string;
  date: string;
  recommendations: AIInsight[];
  context: Record<string, unknown>;
  generatedAt: string;
}

interface SpendingContext {
  totalSpent: number;
  totalBudget: number;
  remaining: number;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
  recentExpenses: Array<{
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
  spendingTrend: 'up' | 'down' | 'stable';
  changePercentage: number;
  currency?: string;
  currencySymbol?: string;
}

// No caching for recommendations (they're daily and managed by the hook)
class RecommendationsRepositoryClass extends BaseRepository {
  /**
   * Get today's recommendations
   */
  async getTodayRecommendations(): Promise<DailyRecommendation | null> {
    return this.get<DailyRecommendation | null>('/api/recommendations/today');
  }

  /**
   * Get recent recommendations (last N days)
   */
  async getRecentRecommendations(days: number = 7): Promise<DailyRecommendation[]> {
    const query = this.buildQueryString({ days });
    return this.get<DailyRecommendation[]>(`/api/recommendations/recent${query}`);
  }

  /**
   * Check if recommendations need refresh
   */
  async needsRefresh(): Promise<{ needsRefresh: boolean }> {
    return this.get<{ needsRefresh: boolean }>('/api/recommendations/needs-refresh');
  }

  /**
   * Generate daily recommendations
   */
  async generateDailyRecommendations(context: SpendingContext): Promise<DailyRecommendation> {
    return this.post<DailyRecommendation>('/api/recommendations/daily', context);
  }
}

// Export singleton instance
export const recommendationsRepository = new RecommendationsRepositoryClass();
