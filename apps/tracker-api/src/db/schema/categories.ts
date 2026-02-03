import {
  pgTable,
  uuid,
  varchar,
  text,
  pgEnum,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const categoryTypeEnum = pgEnum('category_type', ['expense', 'income']);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    color: varchar('color', { length: 7 }).notNull(), // Hex color #RRGGBB
    icon: varchar('icon', { length: 50 }),
    type: categoryTypeEnum('type').default('expense').notNull(),
    budgetLimit: numeric('budget_limit', { precision: 12, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('categories_user_id_idx').on(table.userId),
    index('categories_user_type_idx').on(table.userId, table.type),
  ]
);

// Relations
export const categoriesRelations = relations(categories, ({ one }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
}));

// Types
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
