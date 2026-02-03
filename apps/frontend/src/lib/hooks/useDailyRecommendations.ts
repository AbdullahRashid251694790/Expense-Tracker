/**
 * useDailyRecommendations Hook
 * Fetch and manage daily AI-powered recommendations
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useNetwork } from '@/lib/context/NetworkContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import {
  recommendationsRepository,
  budgetsRepository,
  expensesRepository,
} from '@/lib/api/repositories';
import type { AIInsight, ExpenseWithCategory, BudgetWithProgress } from '@casha/shared';

interface DailyRecommendation {
  userId: string;
  date: string;
  recommendations: AIInsight[];
  context: Record<string, unknown>;
  generatedAt: string;
}

interface UseDailyRecommendationsReturn {
  recommendations: AIInsight[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: string | null;
  isOffline: boolean;
  isCached: boolean;
  refresh: () => Promise<void>;
}

export function useDailyRecommendations(): UseDailyRecommendationsReturn {
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const { currency, currencySymbol } = useCurrency();
  const [dailyRec, setDailyRec] = useState<DailyRecommendation | null>(null);
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Clear state when user changes
  useEffect(() => {
    setDailyRec(null);
    setExpenses([]);
    setBudgets([]);
    setError(null);
    setIsCached(false);
  }, [user?.id]);

  // Fetch expenses and budgets for context building
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setBudgets([]);
      return;
    }

    const fetchData = async () => {
      try {
        const [expensesData, budgetsData] = await Promise.all([
          expensesRepository.getExpensesFresh({ pageSize: 100 }),
          budgetsRepository.getBudgetsFresh(),
        ]);
        setExpenses(expensesData.data || []);
        setBudgets(budgetsData || []);
      } catch (err) {
        console.error('Failed to fetch context data:', err);
      }
    };

    fetchData();
  }, [user]);

  // Calculate spending summary for context
  const calculateSpendingSummary = useCallback(
    (expenseList: ExpenseWithCategory[], overallBudget: BudgetWithProgress | null) => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthExpenses = expenseList.filter((e) => {
        const date = new Date(e.date);
        return date >= monthStart && date <= monthEnd;
      });

      const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalBudget = overallBudget?.amount || 0;
      const remaining = totalBudget - totalSpent;
      const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      return { totalSpent, totalBudget, remaining, percentageUsed };
    },
    []
  );

  // Calculate spending trends
  const calculateSpendingTrends = useCallback(
    (expenseList: ExpenseWithCategory[]) => {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const currentMonthExpenses = expenseList.filter((e) => {
        const date = new Date(e.date);
        return date >= currentMonthStart;
      });

      const previousMonthExpenses = expenseList.filter((e) => {
        const date = new Date(e.date);
        return date >= previousMonthStart && date <= previousMonthEnd;
      });

      const currentTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const previousTotal = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

      const change = currentTotal - previousTotal;
      const changePercentage = previousTotal > 0 ? (change / previousTotal) * 100 : 0;
      const trend: 'up' | 'down' | 'stable' =
        changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable';

      return { currentTotal, previousTotal, change, changePercentage, trend };
    },
    []
  );

  // Calculate category spending
  const calculateCategorySpending = useCallback(
    (expenseList: ExpenseWithCategory[]) => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthExpenses = expenseList.filter((e) => {
        const date = new Date(e.date);
        return date >= monthStart;
      });

      const categoryMap = new Map<string, { name: string; amount: number }>();

      monthExpenses.forEach((e) => {
        const categoryName = e.category?.name || 'Unknown';
        const existing = categoryMap.get(e.categoryId);
        if (existing) {
          existing.amount += e.amount;
        } else {
          categoryMap.set(e.categoryId, { name: categoryName, amount: e.amount });
        }
      });

      const totalAmount = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      return Array.from(categoryMap.values())
        .map((c) => ({
          name: c.name,
          amount: c.amount,
          percentage: totalAmount > 0 ? (c.amount / totalAmount) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    },
    []
  );

  // Build spending context for API request
  const buildSpendingContext = useCallback(() => {
    const overallBudget = budgets.find((b) => b.categoryId === null) || null;
    const summary = calculateSpendingSummary(expenses, overallBudget);
    const categorySpending = calculateCategorySpending(expenses);
    const trends = calculateSpendingTrends(expenses);

    // Get recent expenses
    const recentExpenses = [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((e) => ({
        description: e.description || 'Expense',
        amount: e.amount,
        category: e.category?.name || 'Unknown',
        date: new Date(e.date).toLocaleDateString(),
      }));

    return {
      totalSpent: summary.totalSpent,
      totalBudget: summary.totalBudget,
      remaining: summary.remaining,
      topCategories: categorySpending.slice(0, 5),
      recentExpenses,
      spendingTrend: trends.trend,
      changePercentage: trends.changePercentage,
      currency,
      currencySymbol,
    };
  }, [expenses, budgets, calculateSpendingSummary, calculateCategorySpending, calculateSpendingTrends, currency, currencySymbol]);

  // Check for existing recommendations and fetch if needed
  const loadRecommendations = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsCached(false);

    try {
      // First check if we have today's recommendations
      const existing = await recommendationsRepository.getTodayRecommendations();

      if (existing) {
        setDailyRec(existing);
        setIsCached(false);
        setIsLoading(false);
        return;
      }

      // No today's recommendations - if offline, try to get most recent cached
      if (!isOnline) {
        const recent = await recommendationsRepository.getRecentRecommendations(7);
        if (recent.length > 0) {
          setDailyRec(recent[0]);
          setIsCached(true);
          setIsLoading(false);
          return;
        }
        // No cached recommendations available
        setIsLoading(false);
        return;
      }

      // Online - fetch from API
      // Wait for expenses to load first
      if (expenses.length === 0 && budgets.length === 0) {
        // Data not loaded yet, will retry after data loads
        setIsLoading(false);
        return;
      }

      const context = buildSpendingContext();
      const newRec = await recommendationsRepository.generateDailyRecommendations(context);
      setDailyRec(newRec);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      // If fetch failed and we're offline now, try to get cached
      if (!isOnline) {
        try {
          const recent = await recommendationsRepository.getRecentRecommendations(7);
          if (recent.length > 0) {
            setDailyRec(recent[0]);
            setIsCached(true);
            setIsLoading(false);
            return;
          }
        } catch {
          // Ignore cache fetch error
        }
      }
      setError(err instanceof Error ? err : new Error('Failed to load recommendations'));
    } finally {
      setIsLoading(false);
    }
  }, [user, expenses, budgets, isOnline, buildSpendingContext]);

  // Load recommendations on mount and when expenses/budgets change
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // Force refresh - regenerate recommendations (requires online)
  const refresh = useCallback(async () => {
    if (!user) return;

    // Cannot refresh when offline
    if (!isOnline) {
      setError(new Error('Cannot refresh recommendations while offline'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = buildSpendingContext();
      const newRec = await recommendationsRepository.generateDailyRecommendations(context);
      setDailyRec(newRec);
      setIsCached(false);
    } catch (err) {
      console.error('Failed to refresh recommendations:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh recommendations'));
    } finally {
      setIsLoading(false);
    }
  }, [user, isOnline, buildSpendingContext]);

  return {
    recommendations: dailyRec?.recommendations || [],
    isLoading,
    error,
    lastUpdated: dailyRec?.generatedAt || null,
    isOffline: !isOnline,
    isCached,
    refresh,
  };
}
