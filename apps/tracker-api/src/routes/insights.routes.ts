/**
 * Insights Routes
 * Spending summaries and AI-powered recommendations
 */

import { Router } from 'express';
import { jwtAuthMiddleware, type JwtAuthRequest } from '../middleware/jwt-auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { aiRateLimit } from '../middleware/rateLimit.middleware';
import { aiAdviceSchema, periodQuerySchema } from '../validation/schemas';
import { aiService } from '../services/ai.service';
import * as insightsService from '../services/drizzle/insights.service';

const router = Router();

// All routes require JWT authentication
router.use(jwtAuthMiddleware);

// GET /api/insights/summary - Get spending summary
router.get(
  '/summary',
  validateQuery(periodQuerySchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const period = (req.query.period as 'week' | 'month') === 'week' ? 'weekly' : 'monthly';
      const summary = await insightsService.getSpendingSummary(userId, period);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/insights/category-spending - Get spending by category
router.get(
  '/category-spending',
  validateQuery(periodQuerySchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const period = (req.query.period as 'week' | 'month') === 'week' ? 'weekly' : 'monthly';
      const categorySpending = await insightsService.getCategorySpending(userId, period);
      res.json(categorySpending);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/insights/daily-spending - Get daily spending breakdown
router.get(
  '/daily-spending',
  validateQuery(periodQuerySchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const period = (req.query.period as 'week' | 'month') === 'week' ? 'weekly' : 'monthly';
      const dailySpending = await insightsService.getDailySpending(userId, period);
      res.json(dailySpending);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/insights/trends - Get spending trends
router.get(
  '/trends',
  validateQuery(periodQuerySchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const period = (req.query.period as 'week' | 'month') === 'week' ? 'weekly' : 'monthly';
      const trends = await insightsService.getSpendingTrends(userId, period);
      res.json(trends);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/insights/ai-advice - AI-powered recommendations
// Client sends spending data, server generates AI insights
router.post(
  '/ai-advice',
  aiRateLimit,
  validateBody(aiAdviceSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const {
        period,
        includeCategories,
        includeTrends,
        spendingData,
      } = req.body as {
        period: 'week' | 'month';
        includeCategories: boolean;
        includeTrends: boolean;
        spendingData?: {
          totalSpent: number;
          totalBudget: number;
          categorySpending: Array<{ name: string; amount: number; percentage: number }>;
          trend: 'up' | 'down' | 'stable';
          changePercentage: number;
        };
      };

      // Use provided spending data or defaults
      const data = spendingData || {
        totalSpent: 0,
        totalBudget: 0,
        categorySpending: [],
        trend: 'stable' as const,
        changePercentage: 0,
      };

      // Generate insights using AI service
      const insights = await aiService.generateInsights(
        data,
        { period, includeCategories, includeTrends }
      );

      res.json({
        insights,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
