/**
 * Users Routes
 * Account management operations
 */

import { Router } from 'express';
import { jwtAuthMiddleware, type JwtAuthRequest } from '../middleware/jwt-auth.middleware';
import * as usersService from '../services/drizzle/users.service';

const router = Router();

// All routes require JWT authentication
router.use(jwtAuthMiddleware);

// DELETE /api/users/account - Delete current user's account and all data
router.delete('/account', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const result = await usersService.deleteUserAccount(userId);

    res.json({
      message: result.message,
      success: result.success,
    });
  } catch (error: unknown) {
    console.error('Delete account error:', error);
    next(error);
  }
});

// GET /api/users/stats - Get user statistics
router.get('/stats', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const stats = await usersService.getUserStats(userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
