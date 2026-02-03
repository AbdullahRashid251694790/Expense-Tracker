/**
 * useInsights Hook
 * Analytics with API polling
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { insightsRepository } from '@/lib/api/repositories';
import { usePolling } from './usePolling';
import { useAuth } from '@/lib/context/AuthContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import type { AIInsight } from '@casha/shared';

// Polling interval: 2 minutes (computed data)
const INSIGHTS_POLLING_INTERVAL = 2 * 60 * 1000;

type Period = 'week' | 'month';

// Local types matching API response structure
interface SpendingSummary {
  totalSpent: number;
  totalBudget: number;
  remaining: number;
  percentageUsed: number;
  periodStart: string;
  periodEnd: string;
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

interface PeriodComparison {
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface UseInsightsReturn {
  summary: SpendingSummary | null;
  trends: PeriodComparison | null;
  categorySpending: CategorySpending[];
  dailySpending: DailySpending[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useInsights(period: Period = 'month'): UseInsightsReturn {
  const { user } = useAuth();

  // Fetch spending summary
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = usePolling<{
    totalSpent: number;
    budgetAmount: number | null;
    remaining: number | null;
    percentage: number | null;
    period: 'weekly' | 'monthly';
    startDate: string;
    endDate: string;
  }>({
    fetchFn: () => insightsRepository.getSpendingSummary(period),
    interval: INSIGHTS_POLLING_INTERVAL,
    enabled: !!user,
    key: user?.id,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Fetch category spending
  const {
    data: categoryData,
    isLoading: categoryLoading,
    error: categoryError,
  } = usePolling<CategorySpending[]>({
    fetchFn: () => insightsRepository.getCategorySpending(period),
    interval: INSIGHTS_POLLING_INTERVAL,
    enabled: !!user,
    key: user?.id,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Fetch daily spending
  const {
    data: dailyData,
    isLoading: dailyLoading,
    error: dailyError,
  } = usePolling<DailySpending[]>({
    fetchFn: () => insightsRepository.getDailySpending(period),
    interval: INSIGHTS_POLLING_INTERVAL,
    enabled: !!user,
    key: user?.id,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Fetch trends
  const {
    data: trendsData,
    isLoading: trendsLoading,
    error: trendsError,
  } = usePolling<{
    currentPeriod: number;
    previousPeriod: number;
    change: number;
    changePercentage: number;
    trend: 'up' | 'down' | 'stable';
  }>({
    fetchFn: () => insightsRepository.getSpendingTrends(period),
    interval: INSIGHTS_POLLING_INTERVAL,
    enabled: !!user,
    key: user?.id,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Transform summary data to SpendingSummary format
  const summary: SpendingSummary | null = useMemo(() => {
    if (!summaryData) return null;
    return {
      totalSpent: summaryData.totalSpent,
      totalBudget: summaryData.budgetAmount || 0,
      remaining: summaryData.remaining || 0,
      percentageUsed: summaryData.percentage || 0,
      periodStart: summaryData.startDate,
      periodEnd: summaryData.endDate,
    };
  }, [summaryData]);

  // Transform trends data to PeriodComparison format
  const trends: PeriodComparison | null = useMemo(() => {
    if (!trendsData) return null;
    return {
      currentPeriod: trendsData.currentPeriod,
      previousPeriod: trendsData.previousPeriod,
      change: trendsData.change,
      changePercentage: trendsData.changePercentage,
      trend: trendsData.trend,
    };
  }, [trendsData]);

  const isLoading = summaryLoading || categoryLoading || dailyLoading || trendsLoading;
  const error = summaryError || categoryError || dailyError || trendsError;

  const refetch = useCallback(async () => {
    await refetchSummary();
  }, [refetchSummary]);

  return {
    summary,
    trends,
    categorySpending: categoryData || [],
    dailySpending: dailyData || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * useAIInsights Hook
 * Fetch AI-powered advice from the backend
 */
interface UseAIInsightsReturn {
  insights: AIInsight[];
  isLoading: boolean;
  error: Error | null;
  fetchAdvice: () => Promise<void>;
}

export function useAIInsights(period: Period = 'month'): UseAIInsightsReturn {
  const { user } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAdvice = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // First fetch the actual spending data
      const [summaryData, categoryData, trendsData] = await Promise.all([
        insightsRepository.getSpendingSummary(period),
        insightsRepository.getCategorySpending(period),
        insightsRepository.getSpendingTrends(period),
      ]);

      // Build spending data for AI (including user's currency)
      const spendingData = {
        totalSpent: summaryData.totalSpent || 0,
        totalBudget: summaryData.budgetAmount || 0,
        categorySpending: categoryData.map((c) => ({
          name: c.categoryName,
          amount: c.amount,
          percentage: c.percentage,
        })),
        trend: trendsData.trend || 'stable',
        changePercentage: trendsData.changePercentage || 0,
        currency,
        currencySymbol,
      };

      // Send spending data to AI advice endpoint
      const response = await insightsRepository.getAIAdvice({
        period,
        includeCategories: true,
        includeTrends: true,
        spendingData,
      });

      setInsights(response.insights || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch AI advice'));
    } finally {
      setIsLoading(false);
    }
  }, [period, user, currency, currencySymbol]);

  // Auto-fetch on mount and when period changes
  useEffect(() => {
    if (user) {
      fetchAdvice();
    }
  }, [user, period, fetchAdvice]);

  return {
    insights,
    isLoading,
    error,
    fetchAdvice,
  };
}

/**
 * useDashboardData Hook
 * Combined hook for dashboard page data
 */
interface UseDashboardDataReturn {
  summary: SpendingSummary | null;
  trends: PeriodComparison | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataReturn {
  const { summary, trends, isLoading, error, refetch } = useInsights('month');

  return {
    summary,
    trends,
    isLoading,
    error,
    refetch,
  };
}
