/**
 * Seed Routes
 * Endpoints for seeding demo data
 */

import { Router } from 'express';
import { jwtAuthMiddleware, type JwtAuthRequest } from '../middleware/jwt-auth.middleware';
import { seedDemoData } from '../services/drizzle/seed.service';

const router = Router();

// All routes require JWT authentication
router.use(jwtAuthMiddleware);

/**
 * POST /api/seed
 * Seed demo data for the current user
 */
router.post('/', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const result = await seedDemoData(userId);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
});

export default router;
