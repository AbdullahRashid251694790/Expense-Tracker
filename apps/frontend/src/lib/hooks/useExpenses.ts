/**
 * useExpenses Hook
 * Expense management with API polling
 */

import { useState, useCallback, useMemo } from 'react';
import { expensesRepository } from '@/lib/api/repositories';
import { usePolling } from './usePolling';
import { useAuth } from '@/lib/context/AuthContext';
import { useCategories } from './useCategories';
import type {
  ExpenseWithCategory,
  ExpenseFilters,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  PaginatedResponse,
} from '@casha/shared';

// Polling interval: 30 seconds (expenses change frequently)
const EXPENSES_POLLING_INTERVAL = 30 * 1000;

interface UseExpensesOptions extends ExpenseFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseExpensesReturn {
  expenses: ExpenseWithCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createExpense: (data: CreateExpenseRequest) => Promise<void>;
  updateExpense: (id: string, data: UpdateExpenseRequest) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: ExpenseFilters) => void;
}

export function useExpenses(options: UseExpensesOptions = {}): UseExpensesReturn {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [page, setPage] = useState(options.page || 1);
  const [pageSize] = useState(options.pageSize || 10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<ExpenseFilters>({
    startDate: options.startDate,
    endDate: options.endDate,
    categoryId: options.categoryId,
    minAmount: options.minAmount,
    maxAmount: options.maxAmount,
    search: options.search,
  });

  // Build query params for API
  const queryParams = useMemo(() => ({
    ...filters,
    page,
    limit: pageSize,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
  }), [filters, page, pageSize, options.sortBy, options.sortOrder]);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePolling<PaginatedResponse<ExpenseWithCategory>>({
    fetchFn: () => expensesRepository.getExpensesFresh(queryParams),
    interval: EXPENSES_POLLING_INTERVAL,
    enabled: !!user,
    key: user?.id, // Reset cache when user changes
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Add category data if not already present
  const expenses: ExpenseWithCategory[] = useMemo(() => {
    if (!response?.data) return [];

    const categoriesMap = new Map(categories.map((c) => [c.id, c]));
    return response.data.map((expense) => ({
      ...expense,
      category: expense.category || categoriesMap.get(expense.categoryId) || {
        id: expense.categoryId,
        userId: expense.userId,
        name: 'Unknown',
        color: '#6B7280',
        icon: null,
        type: 'expense' as const,
        budgetLimit: null,
      },
    }));
  }, [response?.data, categories]);

  const total = response?.total || 0;
  const totalPages = response?.totalPages || Math.ceil(total / pageSize);

  const createExpense = useCallback(async (data: CreateExpenseRequest) => {
    setIsSubmitting(true);
    try {
      await expensesRepository.createExpense(data);
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  }, [refetch]);

  const updateExpense = useCallback(
    async (id: string, data: UpdateExpenseRequest) => {
      setIsSubmitting(true);
      try {
        await expensesRepository.updateExpense(id, data);
        await refetch();
      } finally {
        setIsSubmitting(false);
      }
    },
    [refetch]
  );

  const deleteExpense = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      await expensesRepository.deleteExpense(id);
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  }, [refetch]);

  return {
    expenses,
    total,
    page,
    pageSize,
    totalPages,
    isLoading: isLoading || isSubmitting,
    error,
    refetch,
    createExpense,
    updateExpense,
    deleteExpense,
    setPage,
    setFilters,
  };
}

/**
 * useRecentExpenses Hook
 * Fetch only the most recent expenses with polling
 */
export function useRecentExpenses(limit: number = 5) {
  const { user } = useAuth();
  const { categories } = useCategories();

  const {
    data: expenses,
    isLoading,
    error,
    refetch,
  } = usePolling<ExpenseWithCategory[]>({
    fetchFn: () => expensesRepository.getRecentExpenses(limit),
    interval: EXPENSES_POLLING_INTERVAL,
    enabled: !!user,
    key: user?.id, // Reset cache when user changes
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Add category data if not already present
  const expensesWithCategory: ExpenseWithCategory[] = useMemo(() => {
    if (!expenses) return [];

    const categoriesMap = new Map(categories.map((c) => [c.id, c]));
    return expenses.map((expense) => ({
      ...expense,
      category: expense.category || categoriesMap.get(expense.categoryId) || {
        id: expense.categoryId,
        userId: expense.userId,
        name: 'Unknown',
        color: '#6B7280',
        icon: null,
        type: 'expense' as const,
        budgetLimit: null,
      },
    }));
  }, [expenses, categories]);

  return {
    expenses: expensesWithCategory,
    isLoading,
    error,
    refetch,
  };
}
