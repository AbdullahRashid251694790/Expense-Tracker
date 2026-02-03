/**
 * Currency Context
 * Global currency state management with formatting utilities
 * Currency is stored per-user in the database
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { getApiUrl } from '@/lib/api/client';
import type { CurrencyCode } from '@casha/shared';

// Re-export for convenience
export type { CurrencyCode } from '@casha/shared';

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
}

const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB' },
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP' },
  CAD: { code: 'CAD', symbol: '$', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: '$', locale: 'en-AU' },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
  isUpdating: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

const API_URL = getApiUrl();

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { user, refreshUser, getAccessToken } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  // Get currency from user profile, default to USD
  const currency: CurrencyCode = user?.currency || 'USD';
  const config = CURRENCY_CONFIGS[currency];

  // Format currency based on selected currency
  // Always use 'en-US' locale for consistent formatting, no decimals, comma as thousands separator
  const formatCurrency = useCallback(
    (amount: number): string => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: config.code,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      } catch {
        // Fallback formatting
        return `${config.symbol}${Math.round(amount).toLocaleString('en-US')}`;
      }
    },
    [config]
  );

  // Set currency and persist to database via API
  const setCurrency = useCallback(async (newCurrency: CurrencyCode) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const token = getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currency: newCurrency }),
      });

      if (!response.ok) {
        throw new Error('Failed to update currency');
      }

      // Refresh user to get updated currency
      await refreshUser();
    } catch (error) {
      console.error('Failed to update currency:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [user, refreshUser, getAccessToken]);

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      formatCurrency,
      currencySymbol: config.symbol,
      isUpdating,
    }),
    [currency, setCurrency, formatCurrency, config.symbol, isUpdating]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
