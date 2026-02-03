/**
 * Category Types
 * Expense category type definitions
 */

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string | null;
  type: CategoryType;
  budgetLimit: number | null;
}

export interface CreateCategoryRequest {
  name: string;
  color: string;
  icon?: string;
  type: CategoryType;
  budgetLimit?: number | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string;
  type?: CategoryType;
  budgetLimit?: number | null;
}

export type DefaultCategoryName =
  | 'Food'
  | 'Transport'
  | 'Bills'
  | 'Entertainment'
  | 'Shopping'
  | 'Health'
  | 'Other';
