/**
 * Categories Service (Drizzle ORM)
 * CRUD operations for categories using PostgreSQL
 */

import { eq, and, asc } from 'drizzle-orm';
import { db, schema } from '../../db';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@casha/shared';

/**
 * Convert database category to API response format
 */
function toCategoryResponse(category: typeof schema.categories.$inferSelect): Category {
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    color: category.color,
    icon: category.icon,
    type: category.type,
    budgetLimit: category.budgetLimit ? parseFloat(category.budgetLimit) : null,
  };
}

/**
 * Get all categories for a user
 */
export async function getCategories(userId: string): Promise<Category[]> {
  const categories = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.userId, userId))
    .orderBy(asc(schema.categories.name));

  return categories.map(toCategoryResponse);
}

/**
 * Get a single category by ID
 */
export async function getCategory(userId: string, id: string): Promise<Category | null> {
  const category = await db.query.categories.findFirst({
    where: and(eq(schema.categories.id, id), eq(schema.categories.userId, userId)),
  });
  return category ? toCategoryResponse(category) : null;
}

/**
 * Create a new category
 */
export async function createCategory(
  userId: string,
  data: CreateCategoryRequest
): Promise<Category> {
  const [category] = await db
    .insert(schema.categories)
    .values({
      userId,
      name: data.name,
      color: data.color,
      icon: data.icon || null,
      type: data.type,
      budgetLimit: data.budgetLimit?.toString() || null,
    })
    .returning();

  return toCategoryResponse(category);
}

/**
 * Update a category
 */
export async function updateCategory(
  userId: string,
  id: string,
  data: UpdateCategoryRequest
): Promise<void> {
  const updateData: Partial<typeof schema.categories.$inferInsert> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.budgetLimit !== undefined) {
    updateData.budgetLimit = data.budgetLimit?.toString() || null;
  }

  await db
    .update(schema.categories)
    .set(updateData)
    .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, userId)));
}

/**
 * Delete a category
 */
export async function deleteCategory(userId: string, id: string): Promise<void> {
  await db
    .delete(schema.categories)
    .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, userId)));
}
