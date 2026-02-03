/**
 * Default Categories
 * Pre-defined expense categories with colors and icons
 */

import type { DefaultCategoryName, CategoryType } from '../types/category';

export interface DefaultCategory {
  name: DefaultCategoryName;
  color: string;
  icon: string;
  type: CategoryType;
  budgetLimit: number | null;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Food',
    color: '#F97316', // Orange
    icon: 'utensils',
    type: 'expense',
    budgetLimit: null,
  },
  {
    name: 'Transport',
    color: '#3B82F6', // Blue
    icon: 'car',
    type: 'expense',
    budgetLimit: null,
  },
  {
    name: 'Bills',
    color: '#8B5CF6', // Purple
    icon: 'file-text',
    type: 'expense',
    budgetLimit: null,
  },
  {
    name: 'Entertainment',
    color: '#EC4899', // Pink
    icon: 'film',
    type: 'expense',
    budgetLimit: null,
  },
  {
    name: 'Shopping',
    color: '#14B8A6', // Teal
    icon: 'shopping-bag',
    type: 'expense',
    budgetLimit: null,
  },
  {
    name: 'Health',
    color: '#EF4444', // Red
    icon: 'heart-pulse',
    type: 'expense',
    budgetLimit: null,
  },
  {
    name: 'Other',
    color: '#6B7280', // Gray
    icon: 'more-horizontal',
    type: 'expense',
    budgetLimit: null,
  },
];

export const CATEGORY_COLORS: Record<DefaultCategoryName, string> = {
  Food: '#F97316',
  Transport: '#3B82F6',
  Bills: '#8B5CF6',
  Entertainment: '#EC4899',
  Shopping: '#14B8A6',
  Health: '#EF4444',
  Other: '#6B7280',
};

export const CATEGORY_ICONS: Record<DefaultCategoryName, string> = {
  Food: 'utensils',
  Transport: 'car',
  Bills: 'file-text',
  Entertainment: 'film',
  Shopping: 'shopping-bag',
  Health: 'heart-pulse',
  Other: 'more-horizontal',
};
