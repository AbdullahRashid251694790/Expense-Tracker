/**
 * Insights Page
 * Analytics and AI-powered recommendations connected to real APIs
 */

import { useState } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, PieChart, BarChart3, RefreshCw, Sparkles } from 'lucide-react';
import { BentoCard, Button, Skeleton, DonutChart } from '@/components/atoms';
import { useInsights, useAIInsights } from '@/lib/hooks/useInsights';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { cn } from '@/lib/utils/cn';

type Period = 'week' | 'month';

export function InsightsPage() {
  const [period, setPeriod] = useState<Period>('month');
  const { formatCurrency } = useCurrency();

  const {
    summary,
    trends,
    categorySpending,
    isLoading: isLoadingInsights,
    error: insightsError,
    refetch: refetchInsights,
  } = useInsights(period);

  const {
    insights: aiInsights,
    isLoading: isLoadingAI,
    error: aiError,
    fetchAdvice: refetchAI,
  } = useAIInsights(period);

  // Calculate total from category spending
  const totalSpending = categorySpending.reduce((sum, c) => sum + c.amount, 0);

  // Calculate avg daily spend
  const daysInPeriod = period === 'week' ? 7 : 30;
  const avgDaily = summary?.totalSpent ? summary.totalSpent / daysInPeriod : 0;

  // Get highest spending category
  const highestCategory = categorySpending.length > 0
    ? categorySpending.reduce((max, c) => c.amount > max.amount ? c : max, categorySpending[0])
    : null;

  return (
    <div className="space-y-6 animate-in slide-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Insights</h1>
          <p className="text-text-secondary mt-1">
            AI-powered analysis and recommendations
          </p>
        </div>

        {/* Period Toggle */}
        <div className="flex items-center gap-2 bg-surface-muted rounded-bento-sm p-1">
          <button
            onClick={() => setPeriod('week')}
            className={cn(
              'px-4 py-1.5 rounded-bento-sm text-sm font-medium transition-colors',
              period === 'week'
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={cn(
              'px-4 py-1.5 rounded-bento-sm text-sm font-medium transition-colors',
              period === 'month'
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* vs Last Period */}
        <BentoCard className="p-4">
          {isLoadingInsights ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-bento-sm" />
              <div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12 mt-1" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-bento-sm',
                  trends?.trend === 'down' ? 'bg-success/10' : 'bg-error/10'
                )}
              >
                {trends?.trend === 'down' ? (
                  <TrendingDown className="h-5 w-5 text-success" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-error" />
                )}
              </div>
              <div>
                <p className="text-sm text-text-muted">vs Last {period === 'week' ? 'Week' : 'Month'}</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    trends?.trend === 'down' ? 'text-success' : 'text-error'
                  )}
                >
                  {trends ? `${trends.trend === 'down' ? '-' : '+'}${Math.abs(trends.changePercentage).toFixed(0)}%` : '-'}
                </p>
              </div>
            </div>
          )}
        </BentoCard>

        {/* Highest Category */}
        <BentoCard className="p-4">
          {isLoadingInsights ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-bento-sm" />
              <div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-16 mt-1" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-bento-sm">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Highest Category</p>
                <p className="text-xl font-bold text-text-primary">
                  {highestCategory?.categoryName || '-'}
                </p>
              </div>
            </div>
          )}
        </BentoCard>

        {/* Categories Used */}
        <BentoCard className="p-4">
          {isLoadingInsights ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-bento-sm" />
              <div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-8 mt-1" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-bento-sm">
                <PieChart className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Categories Used</p>
                <p className="text-xl font-bold text-text-primary">
                  {categorySpending.length}
                </p>
              </div>
            </div>
          )}
        </BentoCard>

        {/* Avg Daily */}
        <BentoCard className="p-4">
          {isLoadingInsights ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-bento-sm" />
              <div>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-14 mt-1" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-casha-primary/10 rounded-bento-sm">
                <BarChart3 className="h-5 w-5 text-casha-primary" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Avg Daily</p>
                <p className="text-xl font-bold text-text-primary">
                  {formatCurrency(avgDaily)}
                </p>
              </div>
            </div>
          )}
        </BentoCard>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <BentoCard
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-casha-primary" />
                <span>AI Insights</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={refetchAI}
                disabled={isLoadingAI}
              >
                <RefreshCw className={cn('h-4 w-4', isLoadingAI && 'animate-spin')} />
              </Button>
            </div>
          }
        >
          {isLoadingAI ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-bento-sm bg-surface-muted">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full mt-2" />
                      <Skeleton className="h-3 w-3/4 mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : aiError ? (
            <div className="py-8 text-center">
              <p className="text-text-muted">Failed to load AI insights</p>
              <Button variant="link" size="sm" onClick={refetchAI} className="mt-2">
                Try again
              </Button>
            </div>
          ) : aiInsights.length === 0 ? (
            <div className="py-8 text-center">
              <Lightbulb className="h-10 w-10 mx-auto mb-3 text-text-muted/50" />
              <p className="text-text-muted">No insights available yet</p>
              <p className="text-sm text-text-muted mt-1">
                Add more expenses to get personalized recommendations
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {aiInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    'p-4 rounded-bento-sm border-l-4',
                    insight.severity === 'success' && 'bg-success/5 border-l-success',
                    insight.severity === 'warning' && 'bg-warning/5 border-l-warning',
                    insight.severity === 'info' && 'bg-info/5 border-l-info'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb
                      className={cn(
                        'h-5 w-5 flex-shrink-0 mt-0.5',
                        insight.severity === 'success' && 'text-success',
                        insight.severity === 'warning' && 'text-warning',
                        insight.severity === 'info' && 'text-info'
                      )}
                    />
                    <div>
                      <h3 className="font-medium text-text-primary">
                        {insight.title}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </BentoCard>

        {/* Spending by Category */}
        <BentoCard header="Spending by Category">
          {isLoadingInsights ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Skeleton className="h-[200px] w-[200px] rounded-full" />
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-4 w-20" />
                ))}
              </div>
            </div>
          ) : insightsError ? (
            <div className="py-8 text-center">
              <p className="text-text-muted">Failed to load category data</p>
              <Button variant="link" size="sm" onClick={refetchInsights} className="mt-2">
                Try again
              </Button>
            </div>
          ) : categorySpending.length === 0 ? (
            <div className="py-8 text-center">
              <PieChart className="h-10 w-10 mx-auto mb-3 text-text-muted/50" />
              <p className="text-text-muted">No spending data yet</p>
              <p className="text-sm text-text-muted mt-1">
                Add expenses to see category breakdown
              </p>
            </div>
          ) : (
            <>
              {/* Donut Chart */}
              <DonutChart
                data={categorySpending.map((c) => ({
                  name: c.categoryName,
                  value: c.amount,
                  color: c.categoryColor || '#6B7280',
                }))}
                centerValue={formatCurrency(totalSpending)}
                centerLabel="Total Spent"
                showLegend
              />

              {/* Category Breakdown List */}
              <div className="mt-6 pt-4 border-t border-border space-y-3">
                {categorySpending.slice(0, 5).map((category) => (
                  <div key={category.categoryId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: category.categoryColor || '#6B7280' }}
                      />
                      <span className="text-sm text-text-primary">{category.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-primary">
                        {formatCurrency(category.amount)}
                      </span>
                      <span className="text-xs text-text-muted w-10 text-right">
                        {category.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </BentoCard>
      </div>
    </div>
  );
}
