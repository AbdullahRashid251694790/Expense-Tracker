import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { BUDGET_THRESHOLDS } from '@casha/shared';

/**
 * ProgressBar Component
 * Visual budget progress indicator
 *
 * SOLID-S: Single responsibility - progress visualization
 */

const progressVariants = cva('h-full rounded-full transition-all duration-300', {
  variants: {
    status: {
      safe: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-error',
      exceeded: 'bg-red-600',
    },
  },
  defaultVariants: {
    status: 'safe',
  },
});

export interface ProgressBarProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value: number; // 0-100 (can exceed 100)
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

function getProgressStatus(
  percentage: number
): 'safe' | 'warning' | 'danger' | 'exceeded' {
  if (percentage >= BUDGET_THRESHOLDS.EXCEEDED) return 'exceeded';
  if (percentage >= BUDGET_THRESHOLDS.CRITICAL) return 'danger';
  if (percentage >= BUDGET_THRESHOLDS.WARNING) return 'warning';
  return 'safe';
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  status,
  animated = true,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const actualStatus = status || getProgressStatus(value);

  return (
    <div className={cn('w-full', className)} {...props}>
      {/* Track */}
      <div
        className={cn(
          'w-full rounded-full bg-surface-muted overflow-hidden',
          sizeClasses[size]
        )}
      >
        {/* Fill */}
        <div
          className={cn(
            progressVariants({ status: actualStatus }),
            animated && 'transition-all duration-500 ease-out'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-text-muted">
          <span>{Math.round(value)}%</span>
          {value > 100 && (
            <span className="text-error font-medium">Exceeded!</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * BudgetProgress Component
 * Enhanced progress bar specifically for budget tracking
 */
export interface BudgetProgressProps {
  spent: number;
  budget: number;
  label?: string;
  showAmounts?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BudgetProgress({
  spent,
  budget,
  label,
  showAmounts = true,
  size = 'md',
  className,
}: BudgetProgressProps) {
  const { formatCurrency } = useCurrency();
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const remaining = Math.max(budget - spent, 0);
  const status = getProgressStatus(percentage);

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      {(label || showAmounts) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-text-primary">
              {label}
            </span>
          )}
          {showAmounts && (
            <span className="text-sm text-text-secondary">
              {formatCurrency(spent)} / {formatCurrency(budget)}
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <ProgressBar value={percentage} status={status} size={size} />

      {/* Status Label */}
      {percentage >= BUDGET_THRESHOLDS.WARNING && (
        <p
          className={cn(
            'text-xs mt-1 font-medium',
            status === 'warning' && 'text-warning',
            status === 'danger' && 'text-error',
            status === 'exceeded' && 'text-red-600'
          )}
        >
          {status === 'exceeded' && `Over budget by ${formatCurrency(spent - budget)}`}
          {status === 'danger' && `${formatCurrency(remaining)} remaining - Almost depleted!`}
          {status === 'warning' && `${formatCurrency(remaining)} remaining`}
        </p>
      )}
    </div>
  );
}
