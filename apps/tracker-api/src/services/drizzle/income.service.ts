/**
 * Income Service (Drizzle ORM)
 * CRUD operations for income sources using PostgreSQL
 */

import { eq, and, asc } from 'drizzle-orm';
import { db, schema } from '../../db';
import type {
  IncomeSource,
  CreateIncomeSourceRequest,
  UpdateIncomeSourceRequest,
} from '@casha/shared';

/**
 * Convert database income source to API response format
 */
function toIncomeSourceResponse(source: typeof schema.incomeSources.$inferSelect): IncomeSource {
  return {
    id: source.id,
    userId: source.userId,
    name: source.name,
    amount: parseFloat(source.amount),
    frequency: source.frequency,
    createdAt: source.createdAt.toISOString(),
  };
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
      return 0; // One-time income doesn't contribute to monthly
    default:
      return source.amount;
  }
}

/**
 * Get all income sources for a user
 */
export async function getIncomeSources(userId: string): Promise<IncomeSource[]> {
  const sources = await db
    .select()
    .from(schema.incomeSources)
    .where(eq(schema.incomeSources.userId, userId))
    .orderBy(asc(schema.incomeSources.name));

  return sources.map(toIncomeSourceResponse);
}

/**
 * Get a single income source by ID
 */
export async function getIncomeSource(userId: string, id: string): Promise<IncomeSource | null> {
  const source = await db.query.incomeSources.findFirst({
    where: and(eq(schema.incomeSources.id, id), eq(schema.incomeSources.userId, userId)),
  });
  return source ? toIncomeSourceResponse(source) : null;
}

/**
 * Create a new income source
 */
export async function createIncomeSource(
  userId: string,
  data: CreateIncomeSourceRequest
): Promise<IncomeSource> {
  const [source] = await db
    .insert(schema.incomeSources)
    .values({
      userId,
      name: data.name,
      amount: data.amount.toString(),
      frequency: data.frequency,
    })
    .returning();

  return toIncomeSourceResponse(source);
}

/**
 * Update an income source
 */
export async function updateIncomeSource(
  userId: string,
  id: string,
  data: UpdateIncomeSourceRequest
): Promise<void> {
  const updateData: Partial<typeof schema.incomeSources.$inferInsert> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.amount !== undefined) updateData.amount = data.amount.toString();
  if (data.frequency !== undefined) updateData.frequency = data.frequency;

  await db
    .update(schema.incomeSources)
    .set(updateData)
    .where(and(eq(schema.incomeSources.id, id), eq(schema.incomeSources.userId, userId)));
}

/**
 * Delete an income source
 */
export async function deleteIncomeSource(userId: string, id: string): Promise<void> {
  await db
    .delete(schema.incomeSources)
    .where(and(eq(schema.incomeSources.id, id), eq(schema.incomeSources.userId, userId)));
}

/**
 * Calculate total monthly income from all sources
 */
export async function getTotalMonthlyIncome(userId: string): Promise<number> {
  const sources = await getIncomeSources(userId);
  return sources.reduce((total, source) => total + getMonthlyAmount(source), 0);
}
