/**
 * Authentication Service
 * Handles user registration, login, token management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, and, lt } from 'drizzle-orm';
import { db, schema } from '../db';
import { env } from '../config/env';
import { DEFAULT_CATEGORIES } from '@casha/shared';
import type { User, CreateUserRequest, LoginRequest } from '@casha/shared';

const SALT_ROUNDS = 12;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: User;
  tokens: TokenPair;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate access and refresh token pair
 */
export function generateTokens(userId: string, email: string): TokenPair {
  const accessToken = jwt.sign(
    { userId, email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as string }
  );

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as string }
  );

  return { accessToken, refreshToken };
}

/**
 * Store a refresh token in the database
 */
async function storeRefreshToken(userId: string, token: string): Promise<void> {
  // Parse the expiration from the token
  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  await db.insert(schema.refreshTokens).values({
    userId,
    token,
    expiresAt,
  });
}

/**
 * Convert database user to API response format
 */
function toUserResponse(user: typeof schema.users.$inferSelect): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    photoURL: user.photoURL,
    currency: user.currency as User['currency'],
    createdAt: user.createdAt.toISOString(),
    onboardingCompleted: user.onboardingCompleted,
    onboardingCompletedAt: user.onboardingCompletedAt?.toISOString(),
  };
}

/**
 * Register a new user
 */
export async function register(data: CreateUserRequest): Promise<AuthResult> {
  // Check if user already exists
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, data.email.toLowerCase()),
  });

  if (existing) {
    throw new Error('Email already registered');
  }

  const passwordHash = await hashPassword(data.password);

  // Create user and default categories in a transaction
  const result = await db.transaction(async (tx) => {
    // Create user
    const [newUser] = await tx
      .insert(schema.users)
      .values({
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name || null,
        currency: 'USD',
      })
      .returning();

    // Create default categories
    const categoryValues = DEFAULT_CATEGORIES.map((cat) => ({
      userId: newUser.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      type: cat.type as 'expense' | 'income',
      budgetLimit: cat.budgetLimit?.toString() || null,
    }));

    await tx.insert(schema.categories).values(categoryValues);

    return newUser;
  });

  const tokens = generateTokens(result.id, result.email);

  // Store refresh token
  await storeRefreshToken(result.id, tokens.refreshToken);

  return {
    user: toUserResponse(result),
    tokens,
  };
}

/**
 * Login an existing user
 */
export async function login(data: LoginRequest): Promise<AuthResult> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, data.email.toLowerCase()),
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const validPassword = await verifyPassword(data.password, user.passwordHash);
  if (!validPassword) {
    throw new Error('Invalid email or password');
  }

  const tokens = generateTokens(user.id, user.email);

  // Store refresh token
  await storeRefreshToken(user.id, tokens.refreshToken);

  return {
    user: toUserResponse(user),
    tokens,
  };
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
      userId: string;
      email: string;
      type: string;
    };

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Verify refresh token exists in database and is not expired
    const storedToken = await db.query.refreshTokens.findFirst({
      where: and(
        eq(schema.refreshTokens.token, refreshToken),
        gt(schema.refreshTokens.expiresAt, new Date())
      ),
    });

    if (!storedToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new token pair
    const tokens = generateTokens(decoded.userId, decoded.email);

    // Rotate refresh token (delete old, store new)
    await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, refreshToken));
    await storeRefreshToken(decoded.userId, tokens.refreshToken);

    return tokens;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    throw new Error('Invalid refresh token');
  }
}

/**
 * Logout a user (invalidate refresh tokens)
 */
export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    // Logout from current device only
    await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, refreshToken));
  } else {
    // Logout from all devices
    await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId));
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });

  return user ? toUserResponse(user) : null;
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string,
  data: Partial<Pick<User, 'name' | 'photoURL' | 'currency' | 'onboardingCompleted'>>
): Promise<User> {
  const updateData: Partial<typeof schema.users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.photoURL !== undefined) updateData.photoURL = data.photoURL;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.onboardingCompleted !== undefined) {
    updateData.onboardingCompleted = data.onboardingCompleted;
    if (data.onboardingCompleted) {
      updateData.onboardingCompletedAt = new Date();
    }
  }

  const [updated] = await db
    .update(schema.users)
    .set(updateData)
    .where(eq(schema.users.id, userId))
    .returning();

  return toUserResponse(updated);
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
  });

  if (!user) {
    throw new Error('User not found');
  }

  const validPassword = await verifyPassword(currentPassword, user.passwordHash);
  if (!validPassword) {
    throw new Error('Current password is incorrect');
  }

  const newPasswordHash = await hashPassword(newPassword);

  await db
    .update(schema.users)
    .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));

  // Invalidate all refresh tokens (force re-login on all devices)
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId));
}

/**
 * Cleanup expired refresh tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await db
    .delete(schema.refreshTokens)
    .where(lt(schema.refreshTokens.expiresAt, new Date()))
    .returning();

  return result.length;
}

/**
 * Generate a secure random token for password reset
 */
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Request password reset - creates a reset token
 * Returns the token (in production, this would be emailed)
 */
export async function requestPasswordReset(email: string): Promise<{ token: string; expiresAt: Date } | null> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email.toLowerCase()),
  });

  if (!user) {
    // Don't reveal if email exists
    return null;
  }

  // Delete any existing reset tokens for this user
  await db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.userId, user.id));

  // Create new reset token (expires in 1 hour)
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(schema.passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Reset password using a reset token
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  // Find the reset token
  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(schema.passwordResetTokens.token, token),
      gt(schema.passwordResetTokens.expiresAt, new Date())
    ),
  });

  if (!resetToken || resetToken.usedAt) {
    return false;
  }

  // Hash the new password
  const passwordHash = await hashPassword(newPassword);

  // Update the user's password and mark token as used
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(schema.users.id, resetToken.userId));

    await tx
      .update(schema.passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.passwordResetTokens.id, resetToken.id));

    // Invalidate all refresh tokens (force re-login on all devices)
    await tx.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, resetToken.userId));
  });

  return true;
}

/**
 * Verify if a reset token is valid
 */
export async function verifyResetToken(token: string): Promise<boolean> {
  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(schema.passwordResetTokens.token, token),
      gt(schema.passwordResetTokens.expiresAt, new Date())
    ),
  });

  return !!resetToken && !resetToken.usedAt;
}
