/**
 * Currency Utilities
 * Formatting and parsing currency values
 */

export interface CurrencyFormatOptions {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

const DEFAULT_OPTIONS: CurrencyFormatOptions = {
  locale: 'en-US',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Intl.NumberFormat(opts.locale, {
    style: 'currency',
    currency: opts.currency,
    minimumFractionDigits: opts.minimumFractionDigits,
    maximumFractionDigits: opts.maximumFractionDigits,
  }).format(amount);
}

/**
 * Format a number as compact currency (e.g., $1.2K)
 */
export function formatCompactCurrency(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Intl.NumberFormat(opts.locale, {
    style: 'currency',
    currency: opts.currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Parse a currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 0
): string {
  return `${value.toFixed(decimals)}%`;
}
