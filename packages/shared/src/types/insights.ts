/**
 * Insights Types
 * Analytics and AI insights type definitions
 */

export interface SpendingSummary {
  totalSpent: number;
  totalBudget: number;
  remaining: number;
  percentageUsed: number;
  periodStart: string;
  periodEnd: string;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface DailySpending {
  date: string;
  amount: number;
}

export interface PeriodComparison {
  currentPeriod: SpendingSummary;
  previousPeriod: SpendingSummary;
  changeAmount: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AIInsight {
  id: string;
  type: 'spending_analysis' | 'recommendation' | 'pattern_detection' | 'savings_tip';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
  createdAt: string;
}

export interface AIAdviceRequest {
  period: 'week' | 'month';
  includeCategories?: boolean;
  includeTrends?: boolean;
}

export interface AIAdviceResponse {
  insights: AIInsight[];
  generatedAt: string;
}

export interface DailyRecommendation {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  recommendations: AIInsight[];
  context: {
    totalSpent: number;
    totalBudget: number;
    topCategories: string[];
    spendingTrend: 'up' | 'down' | 'stable';
  };
  generatedAt: string;
}
