/**
 * useBudgets Hook
 * Budget management with progress tracking and API polling
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { budgetsRepository } from '@/lib/api/repositories';
import { syncWidgetData } from '@/lib/services/widgetSync.service';
import { usePolling } from './usePolling';
import { useAuth } from '@/lib/context/AuthContext';
import type {
  BudgetWithProgress,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '@casha/shared';

// Polling interval: 1 minute (budget progress updates matter)
const BUDGETS_POLLING_INTERVAL = 60 * 1000;

interface UseBudgetsReturn {
  budgets: BudgetWithProgress[];
  overallBudget: BudgetWithProgress | null;
  categoryBudgets: BudgetWithProgress[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createBudget: (data: CreateBudgetRequest) => Promise<void>;
  updateBudget: (id: string, data: UpdateBudgetRequest) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export function useBudgets(): UseBudgetsReturn {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: budgets,
    isLoading,
    error,
    refetch,
  } = usePolling<BudgetWithProgress[]>({
    fetchFn: () => budgetsRepository.getBudgetsFresh(),
    interval: BUDGETS_POLLING_INTERVAL,
    enabled: !!user,
    key: user?.id,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Derived data - memoized for performance
  const overallBudget = useMemo(
    () => budgets?.find((b) => b.categoryId === null) || null,
    [budgets]
  );

  const categoryBudgets = useMemo(
    () => budgets?.filter((b) => b.categoryId !== null) || [],
    [budgets]
  );

  // Sync widget data when overall budget changes
  useEffect(() => {
    if (overallBudget) {
      syncWidgetData({
        budgetAmount: overallBudget.amount,
        spentAmount: overallBudget.spent,
        remainingAmount: overallBudget.remaining,
        percentUsed: overallBudget.percentage,
        lastUpdated: new Date().toISOString(),
      });
    }
  }, [overallBudget]);

  const createBudget = useCallback(async (data: CreateBudgetRequest) => {
    setIsSubmitting(true);
    try {
      await budgetsRepository.createBudget(data);
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  }, [refetch]);

  const updateBudget = useCallback(
    async (id: string, data: UpdateBudgetRequest) => {
      setIsSubmitting(true);
      try {
        await budgetsRepository.updateBudget(id, data);
        await refetch();
      } finally {
        setIsSubmitting(false);
      }
    },
    [refetch]
  );

  const deleteBudget = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      await budgetsRepository.deleteBudget(id);
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  }, [refetch]);

  return {
    budgets: budgets || [],
    overallBudget,
    categoryBudgets,
    isLoading: isLoading || isSubmitting,
    error,
    refetch,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
