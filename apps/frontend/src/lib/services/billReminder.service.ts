/**
 * Bill Reminder Service
 * Manages bill due date tracking and notifications
 */

import type { Expense } from '@casha/shared';

export interface UpcomingBill {
  expense: Expense;
  dueDate: Date;
  daysUntilDue: number;
  isOverdue: boolean;
}

/**
 * Calculate the next due date for a recurring bill
 */
export function getNextDueDate(expense: Expense): Date | null {
  if (!expense.isRecurring || !expense.dueDay) {
    return null;
  }

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const dueDay = Math.min(expense.dueDay, 28); // Cap at 28 to avoid month boundary issues

  // Try this month first
  let dueDate = new Date(currentYear, currentMonth, dueDay);

  // If already past, move to next month/week
  if (dueDate < today) {
    if (expense.recurringInterval === 'monthly') {
      dueDate = new Date(currentYear, currentMonth + 1, dueDay);
    } else if (expense.recurringInterval === 'weekly') {
      // For weekly, find next occurrence of that day
      const dayOfWeek = dueDay % 7;
      const todayDay = today.getDay();
      const daysUntil = (dayOfWeek - todayDay + 7) % 7 || 7;
      dueDate = new Date(today);
      dueDate.setDate(today.getDate() + daysUntil);
    }
  }

  return dueDate;
}

/**
 * Get days until a bill is due
 */
export function getDaysUntilDue(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if a bill is due soon (within reminder window)
 */
export function isBillDueSoon(expense: Expense): boolean {
  const dueDate = getNextDueDate(expense);
  if (!dueDate) return false;

  const reminderDays = expense.reminderDays ?? 3;
  const daysUntil = getDaysUntilDue(dueDate);

  return daysUntil >= 0 && daysUntil <= reminderDays;
}

/**
 * Check if a bill is overdue
 */
export function isBillOverdue(expense: Expense): boolean {
  const dueDate = getNextDueDate(expense);
  if (!dueDate) return false;

  return getDaysUntilDue(dueDate) < 0;
}

/**
 * Get all upcoming bills sorted by due date
 */
export function getUpcomingBills(expenses: Expense[]): UpcomingBill[] {
  const bills = expenses
    .filter((e) => e.isRecurring && e.isBill && e.dueDay)
    .map((expense) => {
      const dueDate = getNextDueDate(expense);
      if (!dueDate) return null;

      const daysUntilDue = getDaysUntilDue(dueDate);

      return {
        expense,
        dueDate,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
      };
    })
    .filter((bill): bill is UpcomingBill => bill !== null)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return bills;
}

/**
 * Get bills that need reminders (due within reminder window)
 */
export function getBillsNeedingReminder(expenses: Expense[]): UpcomingBill[] {
  return getUpcomingBills(expenses).filter((bill) => {
    const reminderDays = bill.expense.reminderDays ?? 3;
    return bill.daysUntilDue >= 0 && bill.daysUntilDue <= reminderDays;
  });
}

/**
 * Format due date for display
 */
export function formatDueDate(dueDate: Date, daysUntil: number): string {
  if (daysUntil < 0) {
    return `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`;
  }
  if (daysUntil === 0) {
    return 'Due today';
  }
  if (daysUntil === 1) {
    return 'Due tomorrow';
  }
  if (daysUntil <= 7) {
    return `Due in ${daysUntil} days`;
  }
  return `Due ${dueDate.toLocaleDateString()}`;
}

/**
 * Calculate total monthly bill amount
 */
export function getTotalMonthlyBills(expenses: Expense[]): number {
  return expenses
    .filter((e) => e.isRecurring && e.isBill)
    .reduce((sum, e) => {
      if (e.recurringInterval === 'weekly') {
        return sum + e.amount * 4.33;
      }
      return sum + e.amount;
    }, 0);
}
