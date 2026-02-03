import {
  pgTable,
  uuid,
  date,
  jsonb,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const dailyRecommendations = pgTable(
  'daily_recommendations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    recommendations: jsonb('recommendations').notNull(), // AIInsight[]
    context: jsonb('context').notNull(), // { totalSpent, totalBudget, topCategories, spendingTrend }
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('daily_recommendations_user_id_idx').on(table.userId),
    index('daily_recommendations_date_idx').on(table.date),
    unique('daily_recommendations_user_date_unique').on(table.userId, table.date),
  ]
);

// Relations
export const dailyRecommendationsRelations = relations(dailyRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [dailyRecommendations.userId],
    references: [users.id],
  }),
}));

// Types
export type DailyRecommendation = typeof dailyRecommendations.$inferSelect;
export type NewDailyRecommendation = typeof dailyRecommendations.$inferInsert;
