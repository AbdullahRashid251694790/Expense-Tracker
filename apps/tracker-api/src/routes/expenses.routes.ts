/**
 * Expenses Routes
 * CRUD operations for expenses
 */

import { Router } from 'express';
import { jwtAuthMiddleware, type JwtAuthRequest } from '../middleware/jwt-auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
  idParamSchema,
} from '../validation/schemas';
import * as expensesService from '../services/drizzle/expenses.service';
import { Errors } from '../utils/errors';

const router = Router();

// All routes require JWT authentication
router.use(jwtAuthMiddleware);

// GET /api/expenses - List expenses with filters and pagination
router.get(
  '/',
  validateQuery(expenseQuerySchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const query = req.query as Record<string, string | undefined>;
      const page = parseInt(query.page || '1');
      const pageSize = parseInt(query.pageSize || '10');
      const startDate = query.startDate;
      const endDate = query.endDate;
      const categoryId = query.categoryId;
      const minAmount = query.minAmount ? parseFloat(query.minAmount) : undefined;
      const maxAmount = query.maxAmount ? parseFloat(query.maxAmount) : undefined;
      const search = query.search;
      const sortBy = query.sortBy || 'date';
      const sortOrder = (query.sortOrder || 'desc') as 'asc' | 'desc';

      const result = await expensesService.getExpenses(
        userId,
        { startDate, endDate, categoryId, minAmount, maxAmount, search },
        { page, pageSize, sortBy, sortOrder }
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/expenses/recent - Get recent expenses
router.get('/recent', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 5;
    const expenses = await expensesService.getRecentExpenses(userId, limit);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// GET /api/expenses/:id - Get single expense
router.get(
  '/:id',
  validateParams(idParamSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const expense = await expensesService.getExpense(userId, id);
      if (!expense) {
        throw Errors.notFound('Expense');
      }

      res.json(expense);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/expenses - Create expense
router.post(
  '/',
  validateBody(createExpenseSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const expense = await expensesService.createExpense(userId, req.body);
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/expenses/:id - Update expense
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateExpenseSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check if expense exists
      const existing = await expensesService.getExpense(userId, id);
      if (!existing) {
        throw Errors.notFound('Expense');
      }

      await expensesService.updateExpense(userId, id, req.body);

      // Return updated expense
      const updated = await expensesService.getExpense(userId, id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/expenses/:id - Delete expense
router.delete(
  '/:id',
  validateParams(idParamSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check if expense exists
      const existing = await expensesService.getExpense(userId, id);
      if (!existing) {
        throw Errors.notFound('Expense');
      }

      await expensesService.deleteExpense(userId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
