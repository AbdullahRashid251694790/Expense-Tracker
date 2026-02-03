/**
 * Repositories - Barrel Export
 * API access layer for all data operations
 */

// CRUD repositories
export { expensesRepository } from './ExpensesRepository';
export { categoriesRepository } from './CategoriesRepository';
export { budgetsRepository } from './BudgetsRepository';
export { incomeRepository } from './IncomeRepository';
export { chatRepository } from './ChatRepository';
export { recommendationsRepository } from './RecommendationsRepository';
export { insightsRepository } from './InsightsRepository';
export { authRepository } from './AuthRepository';

// Re-export base for extension
export { BaseRepository } from './BaseRepository';
export { ApiError } from '../client';
