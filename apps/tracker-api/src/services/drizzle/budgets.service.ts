/**
 * Budgets Service (Drizzle ORM)
 * CRUD operations for budgets using PostgreSQL
 */

import { eq, and, isNull, desc } from 'drizzle-orm';
import { db, schema } from '../../db';
import { getExpensesForPeriod } from './expenses.service';
import { getCategories } from './categories.service';
import type {
  Budget,
  BudgetWithProgress,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  Category,
  Expense,
} from '@casha/shared';

/**
 * Convert database budget to API response format
 */
function toBudgetResponse(budget: typeof schema.budgets.$inferSelect): Budget {
  return {
    id: budget.id,
    userId: budget.userId,
    categoryId: budget.categoryId,
    amount: parseFloat(budget.amount),
    period: budget.period,
    createdAt: budget.createdAt.toISOString(),
  };
}

/**
 * Get period date range for budget calculations
 */
function getPeriodDates(period: 'weekly' | 'monthly'): { start: Date; end: Date } {
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
 * Calculate budget progress
 */
function calculateProgress(
  budget: Budget,
  expenses: Expense[],
  categories?: Category[]
): BudgetWithProgress {
  const { start, end } = getPeriodDates(budget.period);

  // Filter expenses for this budget's period
  let relevantExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= start && expenseDate <= end;
  });

  // If budget has a category, filter by that category
  if (budget.categoryId) {
    relevantExpenses = relevantExpenses.filter(
      (expense) => expense.categoryId === budget.categoryId
    );
  }

  // Calculate spent amount
  const spent = relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = Math.max(budget.amount - spent, 0);
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

  // Determine status
  let status: 'safe' | 'warning' | 'danger' | 'exceeded';
  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= 90) {
    status = 'danger';
  } else if (percentage >= 75) {
    status = 'warning';
  } else {
    status = 'safe';
  }

  // Attach category if exists
  const category = budget.categoryId
    ? categories?.find((c) => c.id === budget.categoryId)
    : null;

  return {
    ...budget,
    category,
    spent,
    remaining,
    percentage,
    status,
  };
}

/**
 * Get all budgets with progress calculated
 */
export async function getBudgets(userId: string): Promise<BudgetWithProgress[]> {
  const budgetsData = await db
    .select()
    .from(schema.budgets)
    .where(eq(schema.budgets.userId, userId))
    .orderBy(desc(schema.budgets.createdAt));

  const budgets = budgetsData.map(toBudgetResponse);

  // Get expenses for the current month (covers both weekly and monthly periods)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [expenses, categories] = await Promise.all([
    getExpensesForPeriod(userId, monthStart, monthEnd),
    getCategories(userId),
  ]);

  return budgets.map((budget) => calculateProgress(budget, expenses, categories));
}

/**
 * Get a single budget by ID
 */
export async function getBudget(userId: string, id: string): Promise<Budget | null> {
  const budget = await db.query.budgets.findFirst({
    where: and(eq(schema.budgets.id, id), eq(schema.budgets.userId, userId)),
  });
  return budget ? toBudgetResponse(budget) : null;
}

/**
 * Get the overall budget (categoryId is null)
 */
export async function getOverallBudget(userId: string): Promise<BudgetWithProgress | null> {
  const budget = await db.query.budgets.findFirst({
    where: and(eq(schema.budgets.userId, userId), isNull(schema.budgets.categoryId)),
  });

  if (!budget) return null;

  const budgetResponse = toBudgetResponse(budget);

  // Get expenses for this budget's period
  const { start, end } = getPeriodDates(budgetResponse.period);
  const expenses = await getExpensesForPeriod(userId, start, end);

  return calculateProgress(budgetResponse, expenses);
}

/**
 * Create a new budget
 */
export async function createBudget(
  userId: string,
  data: CreateBudgetRequest
): Promise<Budget> {
  const [budget] = await db
    .insert(schema.budgets)
    .values({
      userId,
      categoryId: data.categoryId || null,
      amount: data.amount.toString(),
      period: data.period,
    })
    .returning();

  return toBudgetResponse(budget);
}

/**
 * Update a budget
 */
export async function updateBudget(
  userId: string,
  id: string,
  data: UpdateBudgetRequest
): Promise<void> {
  const updateData: Partial<typeof schema.budgets.$inferInsert> = {};

  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.amount !== undefined) updateData.amount = data.amount.toString();
  if (data.period !== undefined) updateData.period = data.period;

  await db
    .update(schema.budgets)
    .set(updateData)
    .where(and(eq(schema.budgets.id, id), eq(schema.budgets.userId, userId)));
}

/**
 * Delete a budget
 */
export async function deleteBudget(userId: string, id: string): Promise<void> {
  await db
    .delete(schema.budgets)
    .where(and(eq(schema.budgets.id, id), eq(schema.budgets.userId, userId)));
}
