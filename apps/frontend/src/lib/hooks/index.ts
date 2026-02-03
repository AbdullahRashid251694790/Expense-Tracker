/**
 * Hooks - Barrel Export
 * Custom React hooks for data fetching and state management
 */

// Data hooks (use API + polling)
export { useCategories } from './useCategories';
export { useExpenses, useRecentExpenses } from './useExpenses';
export { useBudgets } from './useBudgets';
export { useIncome } from './useIncome';
export { useInsights, useAIInsights, useDashboardData } from './useInsights';
export { useChat } from './useChat';
export { useDailyRecommendations } from './useDailyRecommendations';

// Utility hooks
export { usePolling } from './usePolling';
export { useKeyboard } from './useKeyboard';
