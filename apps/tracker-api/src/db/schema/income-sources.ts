import {
  pgTable,
  uuid,
  varchar,
  numeric,
  pgEnum,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const incomeFrequencyEnum = pgEnum('income_frequency', ['monthly', 'yearly', 'one-time']);

export const incomeSources = pgTable(
  'income_sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    frequency: incomeFrequencyEnum('frequency').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('income_sources_user_id_idx').on(table.userId)]
);

// Relations
export const incomeSourcesRelations = relations(incomeSources, ({ one }) => ({
  user: one(users, {
    fields: [incomeSources.userId],
    references: [users.id],
  }),
}));

// Types
export type IncomeSource = typeof incomeSources.$inferSelect;
export type NewIncomeSource = typeof incomeSources.$inferInsert;
