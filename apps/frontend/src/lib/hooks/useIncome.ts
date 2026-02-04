/**
 * useIncome Hook
 * Income sources management with API polling
 */

import { useState, useCallback, useMemo } from 'react';
import { incomeRepository } from '@/lib/api/repositories';
import { usePolling } from './usePolling';
import { useAuth } from '@/lib/context/AuthContext';
import type {
  IncomeSource,
  CreateIncomeSourceRequest,
  UpdateIncomeSourceRequest,
} from '@casha/shared';

// Polling interval: 5 minutes (income sources rarely change)
const INCOME_POLLING_INTERVAL = 5 * 60 * 1000;

interface UseIncomeReturn {
  incomeSources: IncomeSource[];
  totalMonthlyIncome: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createIncomeSource: (data: CreateIncomeSourceRequest) => Promise<void>;
  updateIncomeSource: (id: string, data: UpdateIncomeSourceRequest) => Promise<void>;
  deleteIncomeSource: (id: string) => Promise<void>;
}

/**
 * Calculate monthly equivalent amount for an income source
 */
function getMonthlyAmount(source: IncomeSource): number {
  switch (source.frequency) {
    case 'monthly':
      return source.amount;
    case 'yearly':
      return source.amount / 12;
    case 'one-time':
      return 0;
    default:
      return source.amount;
  }
}

export function useIncome(): UseIncomeReturn {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: incomeSources,
    isLoading,
    error,
    refetch,
  } = usePolling<IncomeSource[]>({
    fetchFn: () => incomeRepository.getIncomeSourcesFresh(),
    interval: INCOME_POLLING_INTERVAL,
    enabled: !!user,
    key: user?.id,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Calculate total monthly income
  const totalMonthlyIncome = useMemo(() => {
    if (!incomeSources) return 0;
    return incomeSources.reduce((total, source) => total + getMonthlyAmount(source), 0);
  }, [incomeSources]);

  const createIncomeSource = useCallback(async (data: CreateIncomeSourceRequest) => {
    setIsSubmitting(true);
    try {
      await incomeRepository.createIncomeSource(data);
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  }, [refetch]);

  const updateIncomeSource = useCallback(
    async (id: string, data: UpdateIncomeSourceRequest) => {
      setIsSubmitting(true);
      try {
        await incomeRepository.updateIncomeSource(id, data);
        await refetch();
      } finally {
        setIsSubmitting(false);
      }
    },
    [refetch]
  );

  const deleteIncomeSource = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      await incomeRepository.deleteIncomeSource(id);
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  }, [refetch]);

  return {
    incomeSources: incomeSources || [],
    totalMonthlyIncome,
    isLoading: isLoading || isSubmitting,
    error,
    refetch,
    createIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
  };
}
