/**
 * Authentication Routes
 * Handles user registration, login, token refresh, and logout
 */

import { Router } from 'express';
import * as authService from '../services/auth.service.js';
import { jwtAuthMiddleware, type JwtAuthRequest } from '../middleware/jwt-auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validation/schemas.js';
import { env } from '../config/env.js';
import { sendPasswordResetEmail } from '../services/email.service.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already registered') {
      res.status(409).json({ message: error.message });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid email or password') {
      res.status(401).json({ message: error.message });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', validateBody(refreshTokenSchema), async (req, res, next) => {
  try {
    const tokens = await authService.refreshAccessToken(req.body.refreshToken);
    res.json(tokens);
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ message: error.message });
      return;
    }
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout current session or all sessions
 */
router.post('/logout', jwtAuthMiddleware, async (req: JwtAuthRequest, res, next) => {
  try {
    await authService.logout(req.userId!, req.body.refreshToken);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', jwtAuthMiddleware, async (req: JwtAuthRequest, res, next) => {
  try {
    const user = await authService.getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/me
 * Update current user profile
 */
router.put('/me', jwtAuthMiddleware, validateBody(updateProfileSchema), async (req: JwtAuthRequest, res, next) => {
  try {
    const user = await authService.updateUser(req.userId!, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/change-password
 * Change current user's password
 */
router.post(
  '/change-password',
  jwtAuthMiddleware,
  validateBody(changePasswordSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      await authService.changePassword(
        req.userId!,
        req.body.currentPassword,
        req.body.newPassword
      );
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      if (error instanceof Error && error.message === 'Current password is incorrect') {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Request a password reset email
 */
router.post('/forgot-password', validateBody(forgotPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.requestPasswordReset(req.body.email);

    // Always return success to prevent email enumeration
    if (result) {
      // Send the password reset email
      const emailSent = await sendPasswordResetEmail(req.body.email, result.token);

      if (!emailSent) {
        console.error('Failed to send password reset email to:', req.body.email);
      }

      // In development, also log the reset link to console
      if (env.NODE_ENV === 'development') {
        const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${result.token}`;
        console.log('\n========================================');
        console.log('PASSWORD RESET LINK (Development Only):');
        console.log(resetUrl);
        console.log('Expires:', result.expiresAt.toISOString());
        console.log('========================================\n');
      }
    }

    res.json({
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/verify-reset-token
 * Verify if a reset token is valid
 */
router.get('/verify-reset-token', async (req, res) => {
  const token = req.query.token as string;

  if (!token) {
    res.status(400).json({ valid: false, message: 'Token is required' });
    return;
  }

  const isValid = await authService.verifyResetToken(token);
  res.json({ valid: isValid });
});

/**
 * POST /api/auth/reset-password
 * Reset password using a reset token
 */
router.post('/reset-password', validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    const success = await authService.resetPassword(req.body.token, req.body.password);

    if (!success) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    next(error);
  }
});

export default router;
