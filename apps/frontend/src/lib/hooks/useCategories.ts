/**
 * useCategories Hook
 * Category management with API polling
 */

import { useState, useCallback } from 'react';
import { categoriesRepository } from '@/lib/api/repositories';
import { usePolling } from './usePolling';
import { useAuth } from '@/lib/context/AuthContext';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@casha/shared';

// Polling interval: 5 minutes (categories rarely change)
const CATEGORIES_POLLING_INTERVAL = 5 * 60 * 1000;

interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createCategory: (data: CreateCategoryRequest) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = usePolling<Category[]>({
    fetchFn: () => categoriesRepository.getCategoriesFresh(),
    interval: CATEGORIES_POLLING_INTERVAL,
    enabled: !!user,
    key: user?.id,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const createCategory = useCallback(async (data: CreateCategoryRequest) => {
    setIsSubmitting(true);
    try {
      await categoriesRepository.createCategory(data);
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  }, [refetch]);

  const updateCategory = useCallback(
    async (id: string, data: UpdateCategoryRequest) => {
      setIsSubmitting(true);
      try {
        await categoriesRepository.updateCategory(id, data);
        await refetch();
      } finally {
        setIsSubmitting(false);
      }
    },
    [refetch]
  );

  const deleteCategory = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      await categoriesRepository.deleteCategory(id);
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  }, [refetch]);

  return {
    categories: categories || [],
    isLoading: isLoading || isSubmitting,
    error,
    refetch,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
