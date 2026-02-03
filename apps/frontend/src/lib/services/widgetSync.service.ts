/**
 * Widget Sync Service
 * Syncs budget data to Android widget via SharedPreferences
 */

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export interface WidgetData {
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentUsed: number;
  lastUpdated: string;
}

const WIDGET_DATA_KEY = 'CASHA_WIDGET_DATA';

/**
 * Save budget data for widget consumption
 */
export async function syncWidgetData(data: WidgetData): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await Preferences.set({
      key: WIDGET_DATA_KEY,
      value: JSON.stringify(data),
    });

    // Trigger widget update on Android
    if (Capacitor.getPlatform() === 'android') {
      await triggerWidgetUpdate();
    }
  } catch (error) {
    console.error('Failed to sync widget data:', error);
  }
}

/**
 * Get widget data from storage
 */
export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const { value } = await Preferences.get({ key: WIDGET_DATA_KEY });
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

/**
 * Trigger Android widget update
 * This uses a custom Capacitor plugin to send broadcast
 */
async function triggerWidgetUpdate(): Promise<void> {
  // Widget update is handled automatically via SharedPreferences listener
  // The native BudgetWidget class listens for preference changes
  console.log('Widget data synced, native widget will auto-update');
}

/**
 * Clear widget data
 */
export async function clearWidgetData(): Promise<void> {
  try {
    await Preferences.remove({ key: WIDGET_DATA_KEY });
  } catch (error) {
    console.error('Failed to clear widget data:', error);
  }
}

/**
 * Format currency for widget display
 */
export function formatWidgetCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate widget progress percentage
 */
export function calculateProgress(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(Math.round((spent / budget) * 100), 100);
}
