import {
  pgTable,
  uuid,
  numeric,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { categories } from './categories';

export const recurringIntervalEnum = pgEnum('recurring_interval', ['weekly', 'monthly']);

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    description: text('description'),
    date: timestamp('date', { withTimezone: true }).notNull(),
    isRecurring: boolean('is_recurring').default(false).notNull(),
    recurringInterval: recurringIntervalEnum('recurring_interval'),
    isBill: boolean('is_bill').default(false).notNull(),
    dueDay: integer('due_day'), // 1-31
    reminderDays: integer('reminder_days'), // Days before due to remind
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('expenses_user_id_idx').on(table.userId),
    index('expenses_user_date_idx').on(table.userId, table.date),
    index('expenses_category_idx').on(table.categoryId),
    index('expenses_user_category_date_idx').on(table.userId, table.categoryId, table.date),
  ]
);

// Relations
export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}));

// Types
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
