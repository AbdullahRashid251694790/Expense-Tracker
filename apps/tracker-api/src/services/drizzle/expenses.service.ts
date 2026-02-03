/**
 * Expenses Service (Drizzle ORM)
 * CRUD operations for expenses using PostgreSQL
 */

import { eq, and, gte, lte, desc, asc, ilike, sql } from 'drizzle-orm';
import { db, schema } from '../../db';
import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseFilters,
  PaginatedResponse,
  PaginationParams,
  Category,
} from '@casha/shared';

// Expense with embedded category (category is optional since it might not exist)
type ExpenseWithCategory = Expense & { category?: Pick<Category, 'id' | 'name' | 'color' | 'icon' | 'type'> };

/**
 * Convert database expense to API response format (basic)
 */
function toExpenseResponse(expense: typeof schema.expenses.$inferSelect): Expense {
  return {
    id: expense.id,
    userId: expense.userId,
    categoryId: expense.categoryId,
    amount: parseFloat(expense.amount),
    description: expense.description,
    date: expense.date.toISOString(),
    isRecurring: expense.isRecurring,
    recurringInterval: expense.recurringInterval,
    isBill: expense.isBill,
    dueDay: expense.dueDay ?? undefined,
    reminderDays: expense.reminderDays ?? undefined,
    lastReviewedAt: expense.lastReviewedAt?.toISOString(),
    createdAt: expense.createdAt.toISOString(),
  };
}

/**
 * Convert database expense with category to API response format
 */
function toExpenseWithCategoryResponse(
  expense: typeof schema.expenses.$inferSelect,
  category: typeof schema.categories.$inferSelect | null
): ExpenseWithCategory {
  return {
    id: expense.id,
    userId: expense.userId,
    categoryId: expense.categoryId,
    amount: parseFloat(expense.amount),
    description: expense.description,
    date: expense.date.toISOString(),
    isRecurring: expense.isRecurring,
    recurringInterval: expense.recurringInterval,
    isBill: expense.isBill,
    dueDay: expense.dueDay ?? undefined,
    reminderDays: expense.reminderDays ?? undefined,
    lastReviewedAt: expense.lastReviewedAt?.toISOString(),
    createdAt: expense.createdAt.toISOString(),
    category: category
      ? {
          id: category.id,
          name: category.name,
          color: category.color,
          icon: category.icon,
          type: category.type,
        }
      : undefined,
  };
}

/**
 * Get expenses with optional filters and pagination (includes category data)
 */
export async function getExpenses(
  userId: string,
  filters?: ExpenseFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<ExpenseWithCategory>> {
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 20;
  const sortBy = pagination?.sortBy || 'date';
  const sortOrder = pagination?.sortOrder || 'desc';
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [eq(schema.expenses.userId, userId)];

  if (filters?.startDate) {
    conditions.push(gte(schema.expenses.date, new Date(filters.startDate)));
  }
  if (filters?.endDate) {
    conditions.push(lte(schema.expenses.date, new Date(filters.endDate)));
  }
  if (filters?.categoryId) {
    conditions.push(eq(schema.expenses.categoryId, filters.categoryId));
  }
  if (filters?.minAmount !== undefined) {
    conditions.push(gte(schema.expenses.amount, filters.minAmount.toString()));
  }
  if (filters?.maxAmount !== undefined) {
    conditions.push(lte(schema.expenses.amount, filters.maxAmount.toString()));
  }
  if (filters?.search) {
    conditions.push(ilike(schema.expenses.description, `%${filters.search}%`));
  }

  const whereClause = and(...conditions);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.expenses)
    .where(whereClause);
  const total = countResult[0].count;

  // Determine sort column
  const orderColumn =
    sortBy === 'date'
      ? schema.expenses.date
      : sortBy === 'amount'
        ? schema.expenses.amount
        : schema.expenses.createdAt;
  const orderFn = sortOrder === 'desc' ? desc : asc;

  // Get paginated data with category join
  const expenses = await db
    .select({
      expense: schema.expenses,
      category: schema.categories,
    })
    .from(schema.expenses)
    .leftJoin(schema.categories, eq(schema.expenses.categoryId, schema.categories.id))
    .where(whereClause)
    .orderBy(orderFn(orderColumn))
    .limit(pageSize)
    .offset(offset);

  return {
    data: expenses.map((row) => toExpenseWithCategoryResponse(row.expense, row.category)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get a single expense by ID (includes category data)
 */
export async function getExpense(userId: string, id: string): Promise<ExpenseWithCategory | null> {
  const result = await db
    .select({
      expense: schema.expenses,
      category: schema.categories,
    })
    .from(schema.expenses)
    .leftJoin(schema.categories, eq(schema.expenses.categoryId, schema.categories.id))
    .where(and(eq(schema.expenses.id, id), eq(schema.expenses.userId, userId)))
    .limit(1);

  if (result.length === 0) return null;
  return toExpenseWithCategoryResponse(result[0].expense, result[0].category);
}

/**
 * Create a new expense
 */
export async function createExpense(
  userId: string,
  data: CreateExpenseRequest
): Promise<ExpenseWithCategory> {
  const [expense] = await db
    .insert(schema.expenses)
    .values({
      userId,
      categoryId: data.categoryId,
      amount: data.amount.toString(),
      description: data.description || null,
      date: new Date(data.date),
      isRecurring: data.isRecurring || false,
      recurringInterval: data.recurringInterval || null,
      isBill: data.isBill || false,
      dueDay: data.dueDay || null,
      reminderDays: data.reminderDays || null,
    })
    .returning();

  // Fetch the category for the response
  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.id, data.categoryId),
  });

  return toExpenseWithCategoryResponse(expense, category || null);
}

/**
 * Update an expense
 */
export async function updateExpense(
  userId: string,
  id: string,
  data: UpdateExpenseRequest
): Promise<void> {
  const updateData: Partial<typeof schema.expenses.$inferInsert> = {};

  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.amount !== undefined) updateData.amount = data.amount.toString();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
  if (data.recurringInterval !== undefined) updateData.recurringInterval = data.recurringInterval;
  if (data.isBill !== undefined) updateData.isBill = data.isBill;
  if (data.dueDay !== undefined) updateData.dueDay = data.dueDay;
  if (data.reminderDays !== undefined) updateData.reminderDays = data.reminderDays;

  await db
    .update(schema.expenses)
    .set(updateData)
    .where(and(eq(schema.expenses.id, id), eq(schema.expenses.userId, userId)));
}

/**
 * Delete an expense
 */
export async function deleteExpense(userId: string, id: string): Promise<void> {
  await db
    .delete(schema.expenses)
    .where(and(eq(schema.expenses.id, id), eq(schema.expenses.userId, userId)));
}

/**
 * Get recent expenses (for dashboard, etc.) - includes category data
 */
export async function getRecentExpenses(userId: string, limit: number = 5): Promise<ExpenseWithCategory[]> {
  const expenses = await db
    .select({
      expense: schema.expenses,
      category: schema.categories,
    })
    .from(schema.expenses)
    .leftJoin(schema.categories, eq(schema.expenses.categoryId, schema.categories.id))
    .where(eq(schema.expenses.userId, userId))
    .orderBy(desc(schema.expenses.date))
    .limit(limit);

  return expenses.map((row) => toExpenseWithCategoryResponse(row.expense, row.category));
}

/**
 * Get expenses for a specific period (for insights/budgets) - includes category data
 */
export async function getExpensesForPeriod(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ExpenseWithCategory[]> {
  const expenses = await db
    .select({
      expense: schema.expenses,
      category: schema.categories,
    })
    .from(schema.expenses)
    .leftJoin(schema.categories, eq(schema.expenses.categoryId, schema.categories.id))
    .where(
      and(
        eq(schema.expenses.userId, userId),
        gte(schema.expenses.date, startDate),
        lte(schema.expenses.date, endDate)
      )
    )
    .orderBy(desc(schema.expenses.date));

  return expenses.map((row) => toExpenseWithCategoryResponse(row.expense, row.category));
}
