import {
  pgTable,
  uuid,
  numeric,
  pgEnum,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { categories } from './categories';

export const budgetPeriodEnum = pgEnum('budget_period', ['weekly', 'monthly']);

export const budgets = pgTable(
  'budgets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }), // Nullable for overall budget
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    period: budgetPeriodEnum('period').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('budgets_user_id_idx').on(table.userId),
    // Ensure one budget per user-category combination (including null for overall)
    unique('budgets_user_category_unique').on(table.userId, table.categoryId),
  ]
);

// Relations
export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

// Types
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
