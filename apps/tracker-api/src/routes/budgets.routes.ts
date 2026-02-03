/**
 * Budgets Routes
 * CRUD operations for budgets
 */

import { Router } from 'express';
import { jwtAuthMiddleware, type JwtAuthRequest } from '../middleware/jwt-auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  createBudgetSchema,
  updateBudgetSchema,
  idParamSchema,
} from '../validation/schemas';
import * as budgetsService from '../services/drizzle/budgets.service';
import { Errors } from '../utils/errors';

const router = Router();

// All routes require JWT authentication
router.use(jwtAuthMiddleware);

// GET /api/budgets - List all budgets with progress
router.get('/', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const budgets = await budgetsService.getBudgets(userId);
    res.json(budgets);
  } catch (error) {
    next(error);
  }
});

// GET /api/budgets/overall - Get overall budget
router.get('/overall', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const budget = await budgetsService.getOverallBudget(userId);

    if (!budget) {
      return res.json(null);
    }

    res.json(budget);
  } catch (error) {
    next(error);
  }
});

// GET /api/budgets/:id - Get single budget
router.get(
  '/:id',
  validateParams(idParamSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const budget = await budgetsService.getBudget(userId, id);
      if (!budget) {
        throw Errors.notFound('Budget');
      }

      res.json(budget);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/budgets - Create budget
router.post(
  '/',
  validateBody(createBudgetSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const budget = await budgetsService.createBudget(userId, req.body);
      res.status(201).json(budget);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/budgets/:id - Update budget
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateBudgetSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check if budget exists
      const existing = await budgetsService.getBudget(userId, id);
      if (!existing) {
        throw Errors.notFound('Budget');
      }

      await budgetsService.updateBudget(userId, id, req.body);

      // Return updated budget
      const updated = await budgetsService.getBudget(userId, id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/budgets/:id - Delete budget
router.delete(
  '/:id',
  validateParams(idParamSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check if budget exists
      const existing = await budgetsService.getBudget(userId, id);
      if (!existing) {
        throw Errors.notFound('Budget');
      }

      await budgetsService.deleteBudget(userId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
