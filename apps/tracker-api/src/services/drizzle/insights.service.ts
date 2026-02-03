/**
 * Insights Service (Drizzle ORM)
 * Read operations and calculations for spending insights
 */

import { getExpensesForPeriod } from './expenses.service';
import { getCategories } from './categories.service';
import { getOverallBudget } from './budgets.service';

type Period = 'weekly' | 'monthly';

interface SpendingSummary {
  totalSpent: number;
  budgetAmount: number | null;
  remaining: number | null;
  percentage: number | null;
  period: Period;
  startDate: string;
  endDate: string;
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

interface SpendingTrend {
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Get period date range
 */
function getPeriodDates(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === 'weekly') {
    const dayOfWeek = now.getDay();
    start.setDate(now.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

/**
 * Get previous period date range
 */
function getPreviousPeriodDates(period: Period): { start: Date; end: Date } {
  const { start: currentStart } = getPeriodDates(period);
  const start = new Date(currentStart);
  const end = new Date(currentStart);

  if (period === 'weekly') {
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setMonth(start.getMonth() - 1);
    end.setDate(0); // Last day of previous month
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

/**
 * Get spending summary for a period
 */
export async function getSpendingSummary(
  userId: string,
  period: Period = 'monthly'
): Promise<SpendingSummary> {
  const { start, end } = getPeriodDates(period);
  const expenses = await getExpensesForPeriod(userId, start, end);
  const overallBudget = await getOverallBudget(userId);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetAmount = overallBudget?.amount || null;
  const remaining = budgetAmount ? Math.max(budgetAmount - totalSpent, 0) : null;
  const percentage = budgetAmount ? (totalSpent / budgetAmount) * 100 : null;

  return {
    totalSpent,
    budgetAmount,
    remaining,
    percentage,
    period,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/**
 * Get spending by category
 */
export async function getCategorySpending(
  userId: string,
  period: Period = 'monthly'
): Promise<CategorySpending[]> {
  const { start, end } = getPeriodDates(period);
  const [expenses, categories] = await Promise.all([
    getExpensesForPeriod(userId, start, end),
    getCategories(userId),
  ]);

  const categoriesMap = new Map(categories.map((c) => [c.id, c]));
  const categoryTotals = new Map<string, { amount: number; count: number }>();

  // Sum up expenses by category
  expenses.forEach((expense) => {
    const existing = categoryTotals.get(expense.categoryId) || { amount: 0, count: 0 };
    categoryTotals.set(expense.categoryId, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    });
  });

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Convert to array and add category details
  const result: CategorySpending[] = [];
  categoryTotals.forEach((totals, categoryId) => {
    const category = categoriesMap.get(categoryId);
    result.push({
      categoryId,
      categoryName: category?.name || 'Unknown',
      categoryColor: category?.color || '#6B7280',
      amount: totals.amount,
      percentage: totalSpent > 0 ? (totals.amount / totalSpent) * 100 : 0,
      count: totals.count,
    });
  });

  // Sort by amount descending
  result.sort((a, b) => b.amount - a.amount);

  return result;
}

/**
 * Get daily spending breakdown
 */
export async function getDailySpending(
  userId: string,
  period: Period = 'monthly'
): Promise<DailySpending[]> {
  const { start, end } = getPeriodDates(period);
  const expenses = await getExpensesForPeriod(userId, start, end);

  const dailyTotals = new Map<string, { amount: number; count: number }>();

  // Sum up expenses by day
  expenses.forEach((expense) => {
    const dateStr = new Date(expense.date).toISOString().split('T')[0];
    const existing = dailyTotals.get(dateStr) || { amount: 0, count: 0 };
    dailyTotals.set(dateStr, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    });
  });

  // Convert to array and sort by date
  const result: DailySpending[] = [];
  dailyTotals.forEach((totals, date) => {
    result.push({
      date,
      amount: totals.amount,
      count: totals.count,
    });
  });

  result.sort((a, b) => a.date.localeCompare(b.date));

  return result;
}

/**
 * Get spending trends (current vs previous period)
 */
export async function getSpendingTrends(
  userId: string,
  period: Period = 'monthly'
): Promise<SpendingTrend> {
  const { start: currentStart, end: currentEnd } = getPeriodDates(period);
  const { start: prevStart, end: prevEnd } = getPreviousPeriodDates(period);

  const [currentExpenses, previousExpenses] = await Promise.all([
    getExpensesForPeriod(userId, currentStart, currentEnd),
    getExpensesForPeriod(userId, prevStart, prevEnd),
  ]);

  const currentPeriod = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const previousPeriod = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
  const change = currentPeriod - previousPeriod;
  const changePercentage = previousPeriod > 0 ? (change / previousPeriod) * 100 : 0;

  let trend: 'up' | 'down' | 'stable';
  if (Math.abs(changePercentage) < 5) {
    trend = 'stable';
  } else if (change > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }

  return {
    currentPeriod,
    previousPeriod,
    change,
    changePercentage,
    trend,
  };
}
