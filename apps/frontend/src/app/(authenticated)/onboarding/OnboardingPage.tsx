/**
 * Onboarding Page
 * Multi-step wizard for new user setup
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Wallet,
  DollarSign,
  Tag,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Plus,
  Trash2,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/api/client';

import { BentoCard, Button, Select, ProgressBar, PageTransition } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useAuth } from '@/lib/context/AuthContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useCategories } from '@/lib/hooks/useCategories';
import { useIncome } from '@/lib/hooks/useIncome';
import { useBudgets } from '@/lib/hooks/useBudgets';
import { cn } from '@/lib/utils/cn';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'income', title: 'Income', icon: Wallet },
  { id: 'budget', title: 'Budget', icon: DollarSign },
  { id: 'categories', title: 'Categories', icon: Tag },
  { id: 'complete', title: 'Complete', icon: Check },
];

// Income form schema
const incomeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  frequency: z.enum(['monthly', 'yearly', 'one-time']),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

// Budget form schema
const budgetSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  period: z.enum(['weekly', 'monthly']),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const API_URL = getApiUrl();

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshUser, getAccessToken } = useAuth();
  const { formatCurrency, currencySymbol } = useCurrency();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSkipping, setIsSkipping] = useState(false);

  const { categories, isLoading: categoriesLoading } = useCategories();
  const { incomeSources, totalMonthlyIncome, createIncomeSource, deleteIncomeSource } = useIncome();
  const { overallBudget, createBudget } = useBudgets();

  // Income form
  const incomeForm = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      name: '',
      amount: '',
      frequency: 'monthly',
    },
  });

  // Budget form
  const budgetForm = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: '',
      period: 'monthly',
    },
  });

  // Complete onboarding
  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const token = getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          onboardingCompleted: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      await refreshUser();
      navigate('/dashboard');
      toast.success('Welcome to Casha! Your setup is complete.');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to save preferences');
    }
  };

  // Skip onboarding
  const handleSkip = async () => {
    setIsSkipping(true);
    await completeOnboarding();
    setIsSkipping(false);
  };

  // Go to next step (with auto-save for income and budget steps)
  const nextStep = async () => {
    // If on income step and form has valid data, save it first
    if (STEPS[currentStep].id === 'income') {
      const formValues = incomeForm.getValues();
      const hasData = formValues.name.trim() && formValues.amount.trim();

      if (hasData) {
        // Validate and save the filled income data
        const isValid = await incomeForm.trigger();
        if (isValid) {
          try {
            await createIncomeSource({
              name: formValues.name,
              amount: parseFloat(formValues.amount),
              frequency: formValues.frequency,
            });
            incomeForm.reset();
            toast.success('Income source added!');
          } catch {
            toast.error('Failed to add income source');
            return; // Don't proceed if save failed
          }
        } else {
          // Form has data but it's invalid - don't proceed
          toast.error('Please fix the income form or clear it to continue');
          return;
        }
      }
    }

    // If on budget step and form has data but budget not yet created, save it first
    if (STEPS[currentStep].id === 'budget' && !overallBudget) {
      const formValues = budgetForm.getValues();
      const hasData = formValues.amount.trim();

      if (hasData) {
        // Validate and save the filled budget data
        const isValid = await budgetForm.trigger();
        if (isValid) {
          try {
            await createBudget({
              categoryId: null,
              amount: parseFloat(formValues.amount),
              period: formValues.period,
            });
            toast.success('Budget created!');
          } catch {
            toast.error('Failed to create budget');
            return; // Don't proceed if save failed
          }
        } else {
          // Form has data but it's invalid - don't proceed
          toast.error('Please fix the budget form or clear it to continue');
          return;
        }
      }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Go to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Add income source
  const handleAddIncome = async (data: IncomeFormData) => {
    try {
      await createIncomeSource({
        name: data.name,
        amount: parseFloat(data.amount),
        frequency: data.frequency,
      });
      incomeForm.reset();
      toast.success('Income source added!');
    } catch {
      toast.error('Failed to add income source');
    }
  };

  // Create budget
  const handleCreateBudget = async (data: BudgetFormData) => {
    try {
      await createBudget({
        categoryId: null,
        amount: parseFloat(data.amount),
        period: data.period,
      });
      toast.success('Budget created!');
      nextStep();
    } catch {
      toast.error('Failed to create budget');
    }
  };

  // Step content renderers
  const renderWelcomeStep = () => (
    <div className="text-center py-8">
      <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-casha-primary/10 flex items-center justify-center">
        <Sparkles className="h-10 w-10 text-casha-primary" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-3">Welcome to Casha!</h2>
      <p className="text-text-secondary max-w-md mx-auto mb-8">
        Let's set up your expense tracker in just a few steps. This will help you get the most out of Casha.
      </p>
      <div className="space-y-3 max-w-sm mx-auto text-left">
        <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-bento-sm">
          <Wallet className="h-5 w-5 text-success" />
          <span className="text-sm text-text-primary">Set up your income sources</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-bento-sm">
          <DollarSign className="h-5 w-5 text-casha-primary" />
          <span className="text-sm text-text-primary">Create your monthly budget</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-bento-sm">
          <Tag className="h-5 w-5 text-warning" />
          <span className="text-sm text-text-primary">Review your expense categories</span>
        </div>
      </div>
    </div>
  );

  const renderIncomeStep = () => (
    <div className="py-4">
      <h2 className="text-xl font-bold text-text-primary mb-2">Set Up Your Income</h2>
      <p className="text-text-secondary mb-6">
        Add your income sources to better track your finances.
      </p>

      {/* Current income sources */}
      {incomeSources.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-text-muted mb-2">Your income sources:</p>
          <div className="space-y-2">
            {incomeSources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 bg-surface-secondary rounded-bento-sm"
              >
                <div>
                  <span className="font-medium text-text-primary">{source.name}</span>
                  <span className="text-text-muted ml-2">
                    {formatCurrency(source.amount)}/{source.frequency === 'monthly' ? 'mo' : source.frequency === 'yearly' ? 'yr' : 'once'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteIncomeSource(source.id)}
                  className="text-text-muted hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-success/10 rounded-bento-sm">
            <span className="text-sm text-text-muted">Total monthly income: </span>
            <span className="font-bold text-success">{formatCurrency(totalMonthlyIncome)}</span>
          </div>
        </div>
      )}

      {/* Add income form */}
      <form onSubmit={incomeForm.handleSubmit(handleAddIncome)} className="space-y-4">
        <FormField
          label="Source Name"
          placeholder="e.g., Salary, Freelance"
          leftIcon={<Briefcase className="h-4 w-4" />}
          error={incomeForm.formState.errors.name?.message}
          {...incomeForm.register('name')}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            leftIcon={<span className="text-sm font-medium">{currencySymbol}</span>}
            error={incomeForm.formState.errors.amount?.message}
            {...incomeForm.register('amount')}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Frequency</label>
            <Controller
              name="frequency"
              control={incomeForm.control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'yearly', label: 'Yearly' },
                    { value: 'one-time', label: 'One-time' },
                  ]}
                />
              )}
            />
          </div>
        </div>
        <Button
          type="submit"
          variant="secondary"
          leftIcon={<Plus className="h-4 w-4" />}
          isLoading={incomeForm.formState.isSubmitting}
          className="w-full"
        >
          Add Income Source
        </Button>
      </form>
    </div>
  );

  const renderBudgetStep = () => (
    <div className="py-4">
      <h2 className="text-xl font-bold text-text-primary mb-2">Set Your Budget</h2>
      <p className="text-text-secondary mb-6">
        Create a monthly budget to help manage your spending.
      </p>

      {totalMonthlyIncome > 0 && (
        <div className="mb-6 p-4 bg-surface-secondary rounded-bento-sm">
          <p className="text-sm text-text-muted mb-1">Based on your income:</p>
          <p className="text-text-primary">
            <span className="font-medium">Suggested budget:</span>{' '}
            <span className="text-success font-bold">
              {formatCurrency(Math.round(totalMonthlyIncome * 0.8))}
            </span>
            <span className="text-text-muted text-sm ml-1">(80% of income)</span>
          </p>
        </div>
      )}

      {overallBudget ? (
        <div className="p-4 bg-casha-primary/10 rounded-bento-sm text-center">
          <Check className="h-8 w-8 mx-auto mb-2 text-success" />
          <p className="text-text-primary font-medium">Budget already set!</p>
          <p className="text-text-muted text-sm">
            {formatCurrency(overallBudget.amount)}/{overallBudget.period}
          </p>
        </div>
      ) : (
        <form onSubmit={budgetForm.handleSubmit(handleCreateBudget)} className="space-y-4">
          <FormField
            label="Budget Amount"
            type="text"
            inputMode="decimal"
            placeholder={totalMonthlyIncome > 0 ? String(Math.round(totalMonthlyIncome * 0.8)) : '0.00'}
            leftIcon={<span className="text-sm font-medium">{currencySymbol}</span>}
            error={budgetForm.formState.errors.amount?.message}
            {...budgetForm.register('amount')}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">Budget Period</label>
            <Controller
              name="period"
              control={budgetForm.control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'weekly', label: 'Weekly' },
                  ]}
                />
              )}
            />
          </div>
          {/* Warning if budget exceeds income */}
          {(() => {
            const watchedAmount = parseFloat(budgetForm.watch('amount')) || 0;
            const watchedPeriod = budgetForm.watch('period');
            const monthlyBudget = watchedPeriod === 'weekly' ? watchedAmount * 4 : watchedAmount;
            const exceedsIncome = monthlyBudget > 0 && totalMonthlyIncome > 0 && monthlyBudget > totalMonthlyIncome;
            return exceedsIncome ? (
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">Budget exceeds income</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Your budget ({formatCurrency(watchedAmount)}) exceeds your monthly income ({formatCurrency(totalMonthlyIncome)}).
                  </p>
                </div>
              </div>
            ) : null;
          })()}
          <Button
            type="submit"
            isLoading={budgetForm.formState.isSubmitting}
            className="w-full"
          >
            Create Budget
          </Button>
        </form>
      )}
    </div>
  );

  const renderCategoriesStep = () => (
    <div className="py-4">
      <h2 className="text-xl font-bold text-text-primary mb-2">Your Categories</h2>
      <p className="text-text-secondary mb-6">
        These are your default expense categories. You can customize them anytime in Settings.
      </p>

      {categoriesLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-surface-secondary rounded-bento-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 bg-surface-secondary rounded-bento-sm"
            >
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-text-primary font-medium">{category.name}</span>
              <span className="text-xs text-text-muted ml-auto">{category.type}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-text-muted mt-4 text-center">
        You can add more categories from the Budgets page
      </p>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center py-8">
      <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
        <Check className="h-10 w-10 text-success" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-3">You're All Set!</h2>
      <p className="text-text-secondary max-w-md mx-auto mb-8">
        Your expense tracker is ready to use. Start tracking your expenses and take control of your finances.
      </p>

      {/* Summary */}
      <div className="max-w-sm mx-auto space-y-3 text-left mb-8">
        {incomeSources.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-bento-sm">
            <span className="text-text-muted">Monthly Income</span>
            <span className="font-bold text-success">{formatCurrency(totalMonthlyIncome)}</span>
          </div>
        )}
        {overallBudget && (
          <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-bento-sm">
            <span className="text-text-muted">Monthly Budget</span>
            <span className="font-bold text-casha-primary">{formatCurrency(overallBudget.amount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-bento-sm">
          <span className="text-text-muted">Categories</span>
          <span className="font-bold text-text-primary">{categories.length} categories</span>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return renderWelcomeStep();
      case 'income':
        return renderIncomeStep();
      case 'budget':
        return renderBudgetStep();
      case 'categories':
        return renderCategoriesStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center justify-center h-10 w-10 rounded-full transition-colors',
                  index < currentStep
                    ? 'bg-casha-primary text-white'
                    : index === currentStep
                    ? 'bg-casha-primary/20 text-casha-primary border-2 border-casha-primary'
                    : 'bg-surface-secondary text-text-muted'
                )}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
            ))}
          </div>
          <ProgressBar
            value={((currentStep + 1) / STEPS.length) * 100}
            size="sm"
            status="safe"
          />
          <p className="text-xs text-text-muted text-center mt-2">
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
          </p>
        </div>

        {/* Content Card */}
        <BentoCard className="p-6">
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={prevStep} leftIcon={<ChevronLeft className="h-4 w-4" />}>
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleSkip} isLoading={isSkipping}>
                Skip Setup
              </Button>
            )}

            {currentStep === STEPS.length - 1 ? (
              <Button onClick={completeOnboarding} rightIcon={<Check className="h-4 w-4" />}>
                Go to Dashboard
              </Button>
            ) : (
              <Button onClick={nextStep} rightIcon={<ChevronRight className="h-4 w-4" />}>
                {currentStep === 0 ? 'Get Started' : 'Continue'}
              </Button>
            )}
          </div>

          {/* Skip link */}
          {currentStep > 0 && currentStep < STEPS.length - 1 && (
            <div className="text-center mt-4">
              <button
                onClick={handleSkip}
                disabled={isSkipping}
                className="text-xs text-text-muted hover:text-text-secondary underline"
              >
                Skip this step
              </button>
            </div>
          )}
        </BentoCard>
      </div>
    </div>
    </PageTransition>
  );
}
