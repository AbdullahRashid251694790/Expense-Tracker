/**
 * Recommendations Routes
 * Daily AI-powered personalized recommendations + CRUD
 */

import { Router } from 'express';
import { jwtAuthMiddleware, type JwtAuthRequest } from '../middleware/jwt-auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { aiRateLimit } from '../middleware/rateLimit.middleware';
import { recentRecommendationsQuerySchema } from '../validation/schemas';
import { z } from 'zod';
import { recommendationsService } from '../services/recommendations.service';
import * as recommendationsDrizzleService from '../services/drizzle/recommendations.service';

const router = Router();

// All routes require JWT authentication
router.use(jwtAuthMiddleware);

// Validation schema for spending context
const spendingContextSchema = z.object({
  totalSpent: z.number(),
  totalBudget: z.number(),
  remaining: z.number(),
  topCategories: z.array(
    z.object({
      name: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })
  ),
  recentExpenses: z.array(
    z.object({
      description: z.string(),
      amount: z.number(),
      category: z.string(),
      date: z.string(),
    })
  ),
  spendingTrend: z.enum(['up', 'down', 'stable']),
  changePercentage: z.number(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
});

// GET /api/recommendations/today - Get today's recommendations
router.get('/today', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const recommendations = await recommendationsDrizzleService.getTodayRecommendations(userId);
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

// GET /api/recommendations/recent - Get recent recommendations
router.get(
  '/recent',
  validateQuery(recentRecommendationsQuerySchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const days = parseInt(req.query.days as string) || 7;
      const recommendations = await recommendationsDrizzleService.getRecentRecommendations(userId, days);
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/recommendations/needs-refresh - Check if recommendations need refresh
router.get('/needs-refresh', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const needsRefresh = await recommendationsDrizzleService.needsRefresh(userId);
    res.json({ needsRefresh });
  } catch (error) {
    next(error);
  }
});

// POST /api/recommendations/daily - Generate daily recommendations
router.post(
  '/daily',
  aiRateLimit,
  validateBody(spendingContextSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const context = req.body;

      const recommendations = await recommendationsService.generateDailyRecommendations(
        userId,
        context
      );

      // Save to database
      if (recommendations.recommendations) {
        await recommendationsDrizzleService.saveRecommendations(
          userId,
          recommendations.recommendations,
          context
        );
      }

      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
