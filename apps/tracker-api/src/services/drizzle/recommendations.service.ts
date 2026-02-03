/**
 * Recommendations Service (Drizzle ORM)
 * CRUD operations for daily recommendations using PostgreSQL
 */

import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db, schema } from '../../db';
import type { AIInsight } from '@casha/shared';

interface DailyRecommendation {
  userId: string;
  date: string;
  recommendations: AIInsight[];
  context: Record<string, unknown>;
  generatedAt: string;
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get today's recommendations
 */
export async function getTodayRecommendations(
  userId: string
): Promise<DailyRecommendation | null> {
  const today = getTodayDateString();

  const recommendation = await db.query.dailyRecommendations.findFirst({
    where: and(
      eq(schema.dailyRecommendations.userId, userId),
      eq(schema.dailyRecommendations.date, today)
    ),
  });

  if (!recommendation) return null;

  return {
    userId: recommendation.userId,
    date: recommendation.date,
    recommendations: recommendation.recommendations as AIInsight[],
    context: recommendation.context as Record<string, unknown>,
    generatedAt: recommendation.generatedAt.toISOString(),
  };
}

/**
 * Get recent recommendations (last N days)
 */
export async function getRecentRecommendations(
  userId: string,
  days: number = 7
): Promise<DailyRecommendation[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const recommendations = await db
    .select()
    .from(schema.dailyRecommendations)
    .where(
      and(
        eq(schema.dailyRecommendations.userId, userId),
        gte(schema.dailyRecommendations.date, startDateStr),
        lte(schema.dailyRecommendations.date, endDateStr)
      )
    )
    .orderBy(desc(schema.dailyRecommendations.date));

  return recommendations.map((rec) => ({
    userId: rec.userId,
    date: rec.date,
    recommendations: rec.recommendations as AIInsight[],
    context: rec.context as Record<string, unknown>,
    generatedAt: rec.generatedAt.toISOString(),
  }));
}

/**
 * Save daily recommendations
 */
export async function saveRecommendations(
  userId: string,
  recommendations: AIInsight[],
  context: Record<string, unknown>
): Promise<DailyRecommendation> {
  const today = getTodayDateString();

  // Upsert: insert or update if exists
  const [result] = await db
    .insert(schema.dailyRecommendations)
    .values({
      userId,
      date: today,
      recommendations,
      context,
    })
    .onConflictDoUpdate({
      target: [schema.dailyRecommendations.userId, schema.dailyRecommendations.date],
      set: {
        recommendations,
        context,
        generatedAt: new Date(),
      },
    })
    .returning();

  return {
    userId: result.userId,
    date: result.date,
    recommendations: result.recommendations as AIInsight[],
    context: result.context as Record<string, unknown>,
    generatedAt: result.generatedAt.toISOString(),
  };
}

/**
 * Check if recommendations need refresh (if today's don't exist)
 */
export async function needsRefresh(userId: string): Promise<boolean> {
  const today = await getTodayRecommendations(userId);
  return today === null;
}
