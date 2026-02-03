/**
 * Budget Constants
 * Budget thresholds and alert configurations
 */

export const BUDGET_THRESHOLDS = {
  WARNING: 80,   // Show warning at 80%
  CRITICAL: 95,  // Show critical at 95%
  EXCEEDED: 100, // Show exceeded at 100%
} as const;

export const BUDGET_STATUS_COLORS = {
  safe: '#22C55E',     // Green - under 80%
  warning: '#F59E0B',  // Amber - 80-95%
  danger: '#EF4444',   // Red - 95-100%
  exceeded: '#DC2626', // Dark Red - over 100%
} as const;

export const RECURRING_INTERVALS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

export const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;
