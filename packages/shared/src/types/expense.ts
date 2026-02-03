/**
 * Expense Types
 * Expense-related type definitions
 */

import type { Category } from './category';

export type RecurringInterval = 'weekly' | 'monthly';

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  category?: Category;
  amount: number;
  description: string | null;
  date: string;
  isRecurring: boolean;
  recurringInterval: RecurringInterval | null;
  // Bill reminder fields
  isBill?: boolean;
  dueDay?: number; // Day of month (1-31)
  reminderDays?: number; // Days before due to remind (default: 3)
  lastReviewedAt?: string; // For subscription tracking
  createdAt: string;
}

export interface CreateExpenseRequest {
  categoryId: string;
  amount: number;
  description?: string;
  date: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  isBill?: boolean;
  dueDay?: number;
  reminderDays?: number;
}

export interface UpdateExpenseRequest {
  categoryId?: string;
  amount?: number;
  description?: string;
  date?: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  isBill?: boolean;
  dueDay?: number;
  reminderDays?: number;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface ExpenseWithCategory extends Expense {
  category: Category;
}
