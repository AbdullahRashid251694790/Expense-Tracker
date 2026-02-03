/**
 * Subscriptions Page
 * Track and manage recurring expenses/subscriptions
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Plus,
  TrendingUp,
  ArrowLeft,
  Bell,
} from 'lucide-react';
import { BentoCard, Badge, Button, Skeleton } from '@/components/atoms';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { getUpcomingBills, formatDueDate } from '@/lib/services/billReminder.service';
import { cn } from '@/lib/utils/cn';
import type { Expense } from '@casha/shared';

// Category icon mapping
const categoryIcons: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Bills: '💡',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Health: '💊',
  Other: '📦',
};

export function SubscriptionsPage() {
  const { expenses, isLoading } = useExpenses();
  const { formatCurrency } = useCurrency();
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all');

  // Filter recurring expenses (subscriptions)
  const subscriptions = useMemo(() => {
    return expenses.filter((e) => e.isRecurring);
  }, [expenses]);

  // Get upcoming bills
  const upcomingBills = useMemo(() => {
    return getUpcomingBills(expenses);
  }, [expenses]);

  // Filter by interval
  const filteredSubscriptions = useMemo(() => {
    if (filter === 'all') return subscriptions;
    return subscriptions.filter((s) => s.recurringInterval === filter);
  }, [subscriptions, filter]);

  // Calculate totals
  const stats = useMemo(() => {
    const monthlyTotal = subscriptions.reduce((sum, s) => {
      if (s.recurringInterval === 'weekly') {
        return sum + s.amount * 4.33; // Weekly to monthly
      }
      return sum + s.amount;
    }, 0);

    const yearlyTotal = monthlyTotal * 12;
    const weeklyCount = subscriptions.filter((s) => s.recurringInterval === 'weekly').length;
    const monthlyCount = subscriptions.filter((s) => s.recurringInterval === 'monthly').length;

    return { monthlyTotal, yearlyTotal, weeklyCount, monthlyCount, total: subscriptions.length };
  }, [subscriptions]);

  // Get next due date estimate
  const getNextDueDate = (expense: Expense) => {
    const expenseDate = new Date(expense.date);
    const today = new Date();

    if (expense.recurringInterval === 'weekly') {
      const daysDiff = Math.ceil((today.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksElapsed = Math.floor(daysDiff / 7);
      const nextDate = new Date(expenseDate);
      nextDate.setDate(expenseDate.getDate() + (weeksElapsed + 1) * 7);
      return nextDate;
    } else {
      // Monthly
      const nextDate = new Date(expenseDate);
      while (nextDate <= today) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      return nextDate;
    }
  };

  // Check if due soon (within 7 days)
  const isDueSoon = (expense: Expense) => {
    const nextDue = getNextDueDate(expense);
    const today = new Date();
    const daysDiff = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7 && daysDiff >= 0;
  };

  return (
    <div className="space-y-6 animate-in slide-in-up">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/budgets"
          className="p-2 hover:bg-surface-hover rounded-bento-sm transition-colors lg:hidden"
        >
          <ArrowLeft className="h-5 w-5 text-text-muted" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Subscriptions</h1>
          <p className="text-text-secondary mt-1">
            Track your recurring expenses and subscriptions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BentoCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-casha-primary/10 rounded-bento-sm">
              <CreditCard className="h-5 w-5 text-casha-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Total</p>
              <p className="text-lg font-bold text-text-primary">{stats.total}</p>
            </div>
          </div>
        </BentoCard>

        <BentoCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-bento-sm">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Monthly</p>
              <p className="text-lg font-bold text-text-primary">
                {formatCurrency(stats.monthlyTotal)}
              </p>
            </div>
          </div>
        </BentoCard>

        <BentoCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error/10 rounded-bento-sm">
              <Calendar className="h-5 w-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Yearly</p>
              <p className="text-lg font-bold text-text-primary">
                {formatCurrency(stats.yearlyTotal)}
              </p>
            </div>
          </div>
        </BentoCard>

        <BentoCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-bento-sm">
              <RefreshCw className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Weekly</p>
              <p className="text-lg font-bold text-text-primary">{stats.weeklyCount}</p>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Upcoming Bills Section */}
      {upcomingBills.length > 0 && (
        <BentoCard
          header={
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-warning" />
              <span>Upcoming Bills</span>
              <Badge variant="warning" size="sm">
                {upcomingBills.length}
              </Badge>
            </div>
          }
        >
          <div className="divide-y divide-border">
            {upcomingBills.slice(0, 5).map((bill) => (
              <div
                key={bill.expense.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {categoryIcons[bill.expense.category?.name || 'Other'] || '📦'}
                  </span>
                  <div>
                    <p className="font-medium text-text-primary">
                      {bill.expense.description || bill.expense.category?.name || 'Bill'}
                    </p>
                    <p className={cn(
                      'text-xs mt-0.5',
                      bill.isOverdue ? 'text-error font-medium' :
                      bill.daysUntilDue <= 3 ? 'text-warning' : 'text-text-muted'
                    )}>
                      {formatDueDate(bill.dueDate, bill.daysUntilDue)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-text-primary">
                    {formatCurrency(bill.expense.amount)}
                  </p>
                  {bill.isOverdue && (
                    <Badge variant="error" size="sm">Overdue</Badge>
                  )}
                  {!bill.isOverdue && bill.daysUntilDue <= 3 && (
                    <Badge variant="warning" size="sm">Soon</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'monthly', 'weekly'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-bento-sm text-sm font-medium transition-colors',
              filter === f
                ? 'bg-casha-primary text-white'
                : 'bg-surface-muted text-text-secondary hover:text-text-primary'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Subscriptions List */}
      <BentoCard
        header={
          <div className="flex items-center justify-between">
            <span>Active Subscriptions</span>
            <Link to="/expenses">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </Link>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-text-muted opacity-50 mb-3" />
            <p className="text-text-secondary font-medium">No subscriptions yet</p>
            <p className="text-text-muted text-sm mt-1">
              Mark expenses as recurring to track them here
            </p>
            <Link to="/expenses" className="inline-block mt-4">
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Expense
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredSubscriptions.map((subscription) => {
              const dueSoon = isDueSoon(subscription);
              const nextDue = getNextDueDate(subscription);

              return (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {categoryIcons[subscription.category?.name || 'Other'] || '📦'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary">
                          {subscription.description || subscription.category?.name || 'Subscription'}
                        </p>
                        {dueSoon && (
                          <Badge variant="warning" size="sm">
                            Due Soon
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                        <span className="capitalize">{subscription.recurringInterval}</span>
                        <span>•</span>
                        <span>Next: {nextDue.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-primary">
                      {formatCurrency(subscription.amount)}
                    </p>
                    <p className="text-xs text-text-muted">
                      /{subscription.recurringInterval === 'weekly' ? 'week' : 'month'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </BentoCard>

      {/* Insight Card */}
      {subscriptions.length > 0 && (
        <BentoCard className="p-4 bg-gradient-to-r from-casha-primary/5 to-transparent border-l-4 border-l-casha-primary">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-casha-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-text-primary">Subscription Insight</p>
              <p className="text-sm text-text-secondary mt-1">
                You're spending <strong>{formatCurrency(stats.monthlyTotal)}</strong> per month on {stats.total} subscription{stats.total !== 1 ? 's' : ''}.
                That's <strong>{formatCurrency(stats.yearlyTotal)}</strong> per year.
                {stats.monthlyTotal > 100 && ' Consider reviewing unused subscriptions to save money.'}
              </p>
            </div>
          </div>
        </BentoCard>
      )}
    </div>
  );
}
