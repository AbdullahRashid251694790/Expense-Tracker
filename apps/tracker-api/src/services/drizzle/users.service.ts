/**
 * Users Service (Drizzle ORM)
 * Handles user account operations using PostgreSQL
 */

import { eq } from 'drizzle-orm';
import { db, schema } from '../../db';

/**
 * Delete user account and all associated data
 * Note: With CASCADE constraints, deleting the user will automatically
 * delete all related data (categories, expenses, budgets, etc.)
 */
export async function deleteUserAccount(userId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log(`Starting account deletion for user: ${userId}`);

    // With CASCADE constraints, this will delete all related data
    const result = await db
      .delete(schema.users)
      .where(eq(schema.users.id, userId))
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    console.log('Account deletion completed successfully');

    return {
      success: true,
      message: 'Account deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}

/**
 * Get user statistics (counts of various entities)
 */
export async function getUserStats(userId: string): Promise<{
  expenseCount: number;
  categoryCount: number;
  budgetCount: number;
  incomeSourceCount: number;
  conversationCount: number;
}> {
  const [expenses, categories, budgets, incomeSources, conversations] = await Promise.all([
    db.select().from(schema.expenses).where(eq(schema.expenses.userId, userId)),
    db.select().from(schema.categories).where(eq(schema.categories.userId, userId)),
    db.select().from(schema.budgets).where(eq(schema.budgets.userId, userId)),
    db.select().from(schema.incomeSources).where(eq(schema.incomeSources.userId, userId)),
    db.select().from(schema.chatConversations).where(eq(schema.chatConversations.userId, userId)),
  ]);

  return {
    expenseCount: expenses.length,
    categoryCount: categories.length,
    budgetCount: budgets.length,
    incomeSourceCount: incomeSources.length,
    conversationCount: conversations.length,
  };
}
