/**
 * Income Routes
 * CRUD operations for income sources
 */

import { Router } from 'express';
import { jwtAuthMiddleware, type JwtAuthRequest } from '../middleware/jwt-auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  createIncomeSourceSchema,
  updateIncomeSourceSchema,
  idParamSchema,
} from '../validation/schemas';
import * as incomeService from '../services/drizzle/income.service';
import { Errors } from '../utils/errors';

const router = Router();

// All routes require JWT authentication
router.use(jwtAuthMiddleware);

// GET /api/income-sources - List all income sources
router.get('/', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const sources = await incomeService.getIncomeSources(userId);
    res.json(sources);
  } catch (error) {
    next(error);
  }
});

// GET /api/income-sources/total-monthly - Get total monthly income
router.get('/total-monthly', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const total = await incomeService.getTotalMonthlyIncome(userId);
    res.json({ totalMonthlyIncome: total });
  } catch (error) {
    next(error);
  }
});

// GET /api/income-sources/:id - Get single income source
router.get(
  '/:id',
  validateParams(idParamSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const source = await incomeService.getIncomeSource(userId, id);
      if (!source) {
        throw Errors.notFound('Income source');
      }

      res.json(source);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/income-sources - Create income source
router.post(
  '/',
  validateBody(createIncomeSourceSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const source = await incomeService.createIncomeSource(userId, req.body);
      res.status(201).json(source);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/income-sources/:id - Update income source
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateIncomeSourceSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check if income source exists
      const existing = await incomeService.getIncomeSource(userId, id);
      if (!existing) {
        throw Errors.notFound('Income source');
      }

      await incomeService.updateIncomeSource(userId, id, req.body);

      // Return updated income source
      const updated = await incomeService.getIncomeSource(userId, id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/income-sources/:id - Delete income source
router.delete(
  '/:id',
  validateParams(idParamSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check if income source exists
      const existing = await incomeService.getIncomeSource(userId, id);
      if (!existing) {
        throw Errors.notFound('Income source');
      }

      await incomeService.deleteIncomeSource(userId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
