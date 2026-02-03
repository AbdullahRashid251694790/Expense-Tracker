/**
 * Budget Types
 * Budget-related type definitions
 */

import type { Category } from './category';

export type BudgetPeriod = 'weekly' | 'monthly';

export interface Budget {
  id: string;
  userId: string;
  categoryId: string | null;
  category?: Category | null;
  amount: number;
  period: BudgetPeriod;
  createdAt: string;
}

export interface CreateBudgetRequest {
  categoryId?: string | null;
  amount: number;
  period: BudgetPeriod;
}

export interface UpdateBudgetRequest {
  categoryId?: string | null;
  amount?: number;
  period?: BudgetPeriod;
}

export interface BudgetWithProgress extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
}

export interface BudgetAlert {
  budgetId: string;
  categoryName: string | null;
  percentage: number;
  message: string;
  severity: 'warning' | 'critical' | 'exceeded';
}
