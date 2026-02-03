/**
 * Categories Routes
 * CRUD operations for categories
 */

import { Router } from 'express';
import { jwtAuthMiddleware, type JwtAuthRequest } from '../middleware/jwt-auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  idParamSchema,
} from '../validation/schemas';
import * as categoriesService from '../services/drizzle/categories.service';
import { Errors } from '../utils/errors';

const router = Router();

// All routes require JWT authentication
router.use(jwtAuthMiddleware);

// GET /api/categories - List all categories
router.get('/', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const categories = await categoriesService.getCategories(userId);
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:id - Get single category
router.get(
  '/:id',
  validateParams(idParamSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const category = await categoriesService.getCategory(userId, id);
      if (!category) {
        throw Errors.notFound('Category');
      }

      res.json(category);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/categories - Create category
router.post(
  '/',
  validateBody(createCategorySchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const category = await categoriesService.createCategory(userId, req.body);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/categories/:id - Update category
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateCategorySchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check if category exists
      const existing = await categoriesService.getCategory(userId, id);
      if (!existing) {
        throw Errors.notFound('Category');
      }

      await categoriesService.updateCategory(userId, id, req.body);

      // Return updated category
      const updated = await categoriesService.getCategory(userId, id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/categories/:id - Delete category
router.delete(
  '/:id',
  validateParams(idParamSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check if category exists
      const existing = await categoriesService.getCategory(userId, id);
      if (!existing) {
        throw Errors.notFound('Category');
      }

      await categoriesService.deleteCategory(userId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
