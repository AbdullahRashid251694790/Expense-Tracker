/**
 * Seed Service
 * Creates demo data for testing and development
 */

import { db, schema } from '../../db';
import { eq } from 'drizzle-orm';

interface SeedResult {
  success: boolean;
  message: string;
  data: {
    expenses: number;
    categories: number;
    budgets: number;
    incomeSources: number;
  };
}

/**
 * Seed demo data for a user
 * This will REPLACE existing expenses, budgets, and income sources with demo data
 */
export async function seedDemoData(userId: string): Promise<SeedResult> {
  // Get user's existing categories
  const existingCategories = await db.query.categories.findMany({
    where: eq(schema.categories.userId, userId),
  });

  if (existingCategories.length === 0) {
    throw new Error('No categories found. Please create some categories first.');
  }

  // Create a map of category names to IDs for easy lookup
  const categoryMap = new Map<string, string>();
  existingCategories.forEach(cat => {
    categoryMap.set(cat.name.toLowerCase(), cat.id);
  });

  // Helper to get category ID or fallback to first category
  const getCategoryId = (name: string): string => {
    const id = categoryMap.get(name.toLowerCase());
    return id || existingCategories[0].id;
  };

  // Generate dates for the past 30 days
  const today = new Date();
  const getDate = (daysAgo: number): Date => {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  // ============================================================================
  // Clear existing data
  // ============================================================================

  await db.delete(schema.expenses).where(eq(schema.expenses.userId, userId));
  await db.delete(schema.budgets).where(eq(schema.budgets.userId, userId));
  await db.delete(schema.incomeSources).where(eq(schema.incomeSources.userId, userId));

  // ============================================================================
  // Create Demo Expenses (30+ expenses over the past month)
  // ============================================================================

  const demoExpenses = [
    // Recent expenses (last 7 days)
    { categoryName: 'food', amount: 45.50, description: 'Grocery shopping at Whole Foods', daysAgo: 0 },
    { categoryName: 'transportation', amount: 25.00, description: 'Uber ride to airport', daysAgo: 1 },
    { categoryName: 'entertainment', amount: 15.99, description: 'Netflix subscription', daysAgo: 2, isRecurring: true, recurringInterval: 'monthly' },
    { categoryName: 'food', amount: 32.00, description: 'Dinner at Italian restaurant', daysAgo: 2 },
    { categoryName: 'utilities', amount: 85.00, description: 'Electric bill', daysAgo: 3, isBill: true, dueDay: 15 },
    { categoryName: 'shopping', amount: 120.00, description: 'New running shoes', daysAgo: 4 },
    { categoryName: 'food', amount: 8.50, description: 'Coffee and pastry', daysAgo: 5 },
    { categoryName: 'health', amount: 50.00, description: 'Gym membership', daysAgo: 6, isRecurring: true, recurringInterval: 'monthly' },

    // Last week
    { categoryName: 'food', amount: 65.00, description: 'Weekly groceries', daysAgo: 7 },
    { categoryName: 'transportation', amount: 40.00, description: 'Gas station fill-up', daysAgo: 8 },
    { categoryName: 'entertainment', amount: 25.00, description: 'Movie tickets', daysAgo: 9 },
    { categoryName: 'food', amount: 18.00, description: 'Lunch at work', daysAgo: 10 },
    { categoryName: 'utilities', amount: 45.00, description: 'Internet bill', daysAgo: 11, isBill: true, dueDay: 20 },
    { categoryName: 'shopping', amount: 35.00, description: 'Books from Amazon', daysAgo: 12 },
    { categoryName: 'health', amount: 25.00, description: 'Pharmacy - vitamins', daysAgo: 13 },

    // Two weeks ago
    { categoryName: 'food', amount: 55.00, description: 'Grocery run', daysAgo: 14 },
    { categoryName: 'transportation', amount: 15.00, description: 'Bus pass', daysAgo: 15 },
    { categoryName: 'entertainment', amount: 60.00, description: 'Concert tickets', daysAgo: 16 },
    { categoryName: 'food', amount: 42.00, description: 'Birthday dinner', daysAgo: 17 },
    { categoryName: 'utilities', amount: 35.00, description: 'Phone bill', daysAgo: 18, isBill: true, dueDay: 25 },
    { categoryName: 'shopping', amount: 80.00, description: 'Home decor items', daysAgo: 19 },
    { categoryName: 'health', amount: 120.00, description: 'Doctor visit copay', daysAgo: 20 },

    // Three weeks ago
    { categoryName: 'food', amount: 70.00, description: 'Costco bulk shopping', daysAgo: 21 },
    { categoryName: 'transportation', amount: 35.00, description: 'Parking fees', daysAgo: 22 },
    { categoryName: 'entertainment', amount: 12.99, description: 'Spotify premium', daysAgo: 23, isRecurring: true, recurringInterval: 'monthly' },
    { categoryName: 'food', amount: 28.00, description: 'Thai food delivery', daysAgo: 24 },
    { categoryName: 'utilities', amount: 65.00, description: 'Water bill', daysAgo: 25, isBill: true, dueDay: 10 },
    { categoryName: 'shopping', amount: 45.00, description: 'Office supplies', daysAgo: 26 },
    { categoryName: 'health', amount: 30.00, description: 'Yoga class', daysAgo: 27 },

    // Four weeks ago
    { categoryName: 'food', amount: 48.00, description: 'Farmers market', daysAgo: 28 },
    { categoryName: 'transportation', amount: 50.00, description: 'Car wash and detail', daysAgo: 29 },
    { categoryName: 'entertainment', amount: 40.00, description: 'Bowling night', daysAgo: 30 },

    // Extra expenses for more data
    { categoryName: 'food', amount: 22.00, description: 'Pizza delivery', daysAgo: 3 },
    { categoryName: 'food', amount: 15.00, description: 'Smoothie bar', daysAgo: 6 },
    { categoryName: 'shopping', amount: 65.00, description: 'Electronics accessories', daysAgo: 8 },
    { categoryName: 'transportation', amount: 30.00, description: 'Train tickets', daysAgo: 12 },
    { categoryName: 'entertainment', amount: 20.00, description: 'Video game purchase', daysAgo: 14 },
    { categoryName: 'food', amount: 38.00, description: 'Sushi dinner', daysAgo: 19 },
    { categoryName: 'health', amount: 45.00, description: 'Massage therapy', daysAgo: 25 },
  ];

  const expenseValues = demoExpenses.map(exp => ({
    userId,
    categoryId: getCategoryId(exp.categoryName),
    amount: exp.amount.toString(),
    description: exp.description,
    date: getDate(exp.daysAgo),
    isRecurring: exp.isRecurring || false,
    recurringInterval: (exp.recurringInterval || null) as 'weekly' | 'monthly' | null,
    isBill: exp.isBill || false,
    dueDay: exp.dueDay || null,
  }));

  await db.insert(schema.expenses).values(expenseValues);

  // ============================================================================
  // Create Demo Budgets
  // ============================================================================

  const demoBudgets = [
    { categoryId: null, amount: 2500, period: 'monthly' as const }, // Overall monthly budget
    { categoryId: getCategoryId('food'), amount: 600, period: 'monthly' as const },
    { categoryId: getCategoryId('entertainment'), amount: 200, period: 'monthly' as const },
    { categoryId: getCategoryId('transportation'), amount: 250, period: 'monthly' as const },
    { categoryId: getCategoryId('shopping'), amount: 400, period: 'monthly' as const },
    { categoryId: getCategoryId('utilities'), amount: 300, period: 'monthly' as const },
    { categoryId: getCategoryId('health'), amount: 350, period: 'monthly' as const },
  ];

  await db.insert(schema.budgets).values(
    demoBudgets.map(b => ({
      userId,
      categoryId: b.categoryId,
      amount: b.amount.toString(),
      period: b.period,
    }))
  );

  // ============================================================================
  // Create Demo Income Sources
  // ============================================================================

  const demoIncome = [
    { name: 'Salary', amount: 5000, frequency: 'monthly' as const },
    { name: 'Freelance Work', amount: 800, frequency: 'monthly' as const },
    { name: 'Side Business', amount: 300, frequency: 'monthly' as const },
  ];

  await db.insert(schema.incomeSources).values(
    demoIncome.map(inc => ({
      userId,
      name: inc.name,
      amount: inc.amount.toString(),
      frequency: inc.frequency,
    }))
  );

  // ============================================================================
  // Calculate totals for response
  // ============================================================================

  const totalExpenses = demoExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = demoBudgets.find(b => b.categoryId === null)?.amount || 0;
  const totalIncome = demoIncome.reduce((sum, i) => i.frequency === 'monthly' ? sum + i.amount : sum, 0);

  return {
    success: true,
    message: `Demo data created! Total expenses: $${totalExpenses.toFixed(0)}, Monthly budget: $${totalBudget}, Monthly income: $${totalIncome}`,
    data: {
      expenses: demoExpenses.length,
      categories: 0,
      budgets: demoBudgets.length,
      incomeSources: demoIncome.length,
    },
  };
}
