/**
 * Zod Validation Schemas
 * Request validation for all API endpoints
 */

import { z } from 'zod';

// ============================================================================
// Common Validators
// ============================================================================

const emailSchema = z.string().email('Invalid email format');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be hex format #RRGGBB');
const positiveNumberSchema = z.number().positive('Amount must be positive');

// ============================================================================
// Auth Schemas
// ============================================================================

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(255).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  photoURL: z.string().max(10000000).optional(), // Base64 images up to ~7MB
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD']).optional(),
  onboardingCompleted: z.boolean().optional(),
});

// ============================================================================
// Category Schemas (Firestore - string IDs)
// ============================================================================

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: colorSchema,
  icon: z.string().max(50).optional().nullable(),
  type: z.enum(['expense', 'income']).default('expense'),
  budgetLimit: z.number().positive().optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: colorSchema.optional(),
  icon: z.string().max(50).optional().nullable(),
  type: z.enum(['expense', 'income']).optional(),
  budgetLimit: z.number().positive().optional().nullable(),
});

// ============================================================================
// Expense Schemas (Firestore - string IDs)
// ============================================================================

export const createExpenseSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  amount: positiveNumberSchema,
  description: z.string().max(1000).optional().nullable(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  isRecurring: z.boolean().optional().default(false),
  recurringInterval: z.enum(['weekly', 'monthly']).optional().nullable(),
  isBill: z.boolean().optional().default(false),
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
  reminderDays: z.number().int().min(1).max(30).optional().nullable(),
});

export const updateExpenseSchema = z.object({
  categoryId: z.string().min(1).optional(),
  amount: positiveNumberSchema.optional(),
  description: z.string().max(1000).optional().nullable(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['weekly', 'monthly']).optional().nullable(),
  isBill: z.boolean().optional(),
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
  reminderDays: z.number().int().min(1).max(30).optional().nullable(),
});

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// Budget Schemas (Firestore - string IDs)
// ============================================================================

export const createBudgetSchema = z.object({
  categoryId: z.string().optional().nullable(),
  amount: positiveNumberSchema,
  period: z.enum(['weekly', 'monthly']),
});

export const updateBudgetSchema = z.object({
  categoryId: z.string().optional().nullable(),
  amount: positiveNumberSchema.optional(),
  period: z.enum(['weekly', 'monthly']).optional(),
});

// ============================================================================
// Income Source Schemas
// ============================================================================

export const createIncomeSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: positiveNumberSchema,
  frequency: z.enum(['monthly', 'yearly', 'one-time']),
});

export const updateIncomeSourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: positiveNumberSchema.optional(),
  frequency: z.enum(['monthly', 'yearly', 'one-time']).optional(),
});

// ============================================================================
// Chat Conversation Schemas
// ============================================================================

export const createConversationSchema = z.object({
  title: z.string().max(200).optional().default('New Conversation'),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200),
});

export const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10000),
});

// ============================================================================
// Recommendations Schemas
// ============================================================================

export const recentRecommendationsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).optional().default(7),
});

// ============================================================================
// Insights Schemas
// ============================================================================

export const periodQuerySchema = z.object({
  period: z.enum(['week', 'month']).optional().default('month'),
});

export const dailyQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export const aiAdviceSchema = z.object({
  period: z.enum(['week', 'month']).optional().default('month'),
  includeCategories: z.coerce.boolean().optional().default(true),
  includeTrends: z.coerce.boolean().optional().default(true),
  spendingData: z.object({
    totalSpent: z.number(),
    totalBudget: z.number(),
    categorySpending: z.array(z.object({
      name: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })),
    trend: z.enum(['up', 'down', 'stable']),
    changePercentage: z.number(),
    currency: z.string().optional(),
    currencySymbol: z.string().optional(),
  }).optional(),
});

// ============================================================================
// Chat Schemas
// ============================================================================

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000),
  conversationId: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  context: z.object({
    totalSpent: z.number().optional(),
    totalBudget: z.number().optional(),
    remaining: z.number().optional(),
    topCategories: z.array(z.object({
      name: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })).optional(),
    recentExpenses: z.array(z.object({
      description: z.string(),
      amount: z.number(),
      category: z.string(),
      date: z.string(),
    })).optional(),
    spendingTrend: z.enum(['up', 'down', 'stable']).optional(),
    currency: z.string().optional(),
    currencySymbol: z.string().optional(),
  }).optional(),
});

export const chatQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// ============================================================================
// Common Param Schemas (Firestore - string IDs)
// ============================================================================

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const conversationIdParamSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
});

// ============================================================================
// Type Exports
// ============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type CreateIncomeSourceInput = z.infer<typeof createIncomeSourceSchema>;
export type UpdateIncomeSourceInput = z.infer<typeof updateIncomeSourceSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type RecentRecommendationsQueryInput = z.infer<typeof recentRecommendationsQuerySchema>;
export type PeriodQueryInput = z.infer<typeof periodQuerySchema>;
export type DailyQueryInput = z.infer<typeof dailyQuerySchema>;
export type AiAdviceInput = z.infer<typeof aiAdviceSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ChatQueryInput = z.infer<typeof chatQuerySchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type ConversationIdParamInput = z.infer<typeof conversationIdParamSchema>;
