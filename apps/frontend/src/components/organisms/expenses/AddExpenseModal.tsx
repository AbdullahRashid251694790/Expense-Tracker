/**
 * AddExpenseModal Organism
 * Modal form for adding new expenses
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, FileText, RefreshCw, Bell, Receipt } from 'lucide-react';
import { toast } from 'sonner';

import { Modal, ModalFooter, Button, Select } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useCategories } from '@/lib/hooks/useCategories';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { expensesRepository } from '@/lib/api/repositories';
import { cn } from '@/lib/utils/cn';
import type { Expense } from '@casha/shared';

const addExpenseSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['weekly', 'monthly']).optional(),
  // Bill reminder fields
  isBill: z.boolean().default(false),
  dueDay: z.coerce.number().min(1).max(31).optional(),
  reminderDays: z.coerce.number().min(1).max(30).optional(),
});

type AddExpenseFormData = z.infer<typeof addExpenseSchema>;

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialValues?: {
    amount?: string;
    description?: string;
    date?: string;
  };
  editExpense?: Expense;
}

export function AddExpenseModal({ isOpen, onClose, onSuccess, initialValues, editExpense }: AddExpenseModalProps) {
  const isEditing = !!editExpense;
  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { currencySymbol } = useCurrency();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddExpenseFormData>({
    resolver: zodResolver(addExpenseSchema),
    defaultValues: {
      amount: '',
      categoryId: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringInterval: undefined,
      isBill: false,
      dueDay: undefined,
      reminderDays: 3,
    },
  });

  const isRecurring = watch('isRecurring');
  const isBill = watch('isBill');

  // Reset form when modal closes or apply initial values when opening
  useEffect(() => {
    if (!isOpen) {
      reset();
    } else if (editExpense) {
      // Populate all fields when editing an existing expense
      reset({
        amount: String(editExpense.amount),
        categoryId: editExpense.categoryId,
        description: editExpense.description || '',
        date: editExpense.date,
        isRecurring: editExpense.isRecurring,
        recurringInterval: editExpense.recurringInterval || undefined,
        isBill: editExpense.isBill || false,
        dueDay: editExpense.dueDay,
        reminderDays: editExpense.reminderDays || 3,
      });
    } else if (initialValues) {
      reset({
        amount: initialValues.amount || '',
        categoryId: '',
        description: initialValues.description || '',
        date: initialValues.date || new Date().toISOString().split('T')[0],
        isRecurring: false,
        recurringInterval: undefined,
        isBill: false,
        dueDay: undefined,
        reminderDays: 3,
      });
    }
  }, [isOpen, reset, initialValues, editExpense]);

  const onSubmit = async (data: AddExpenseFormData) => {
    try {
      const expenseData = {
        amount: parseFloat(data.amount),
        categoryId: data.categoryId,
        description: data.description || undefined,
        date: data.date,
        isRecurring: data.isRecurring,
        recurringInterval: data.isRecurring ? data.recurringInterval : undefined,
        isBill: data.isRecurring && data.isBill,
        dueDay: data.isRecurring && data.isBill ? data.dueDay : undefined,
        reminderDays: data.isRecurring && data.isBill ? data.reminderDays : undefined,
      };

      if (isEditing && editExpense) {
        await expensesRepository.updateExpense(editExpense.id, expenseData);
        toast.success('Expense updated successfully!');
      } else {
        await expensesRepository.createExpense(expenseData);
        toast.success('Expense added successfully!');
      }

      reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'add'} expense. Please try again.`);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Expense' : 'Add Expense'}
      description={isEditing ? 'Update your expense details' : 'Track a new expense in your budget'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Amount */}
        <FormField
          label="Amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          leftIcon={<span className="text-sm font-medium">{currencySymbol}</span>}
          error={errors.amount?.message}
          {...register('amount')}
        />

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">
            Category <span className="text-error">*</span>
          </label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select a category"
                disabled={isLoadingCategories}
                error={!!errors.categoryId}
                options={categories.map((cat) => ({
                  value: String(cat.id),
                  label: cat.name,
                }))}
              />
            )}
          />
          {errors.categoryId && (
            <p className="text-xs text-error">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Description */}
        <FormField
          label="Description"
          placeholder="What was this expense for?"
          leftIcon={<FileText className="h-4 w-4" />}
          {...register('description')}
        />

        {/* Date */}
        <FormField
          label="Date"
          type="date"
          leftIcon={<Calendar className="h-4 w-4" />}
          error={errors.date?.message}
          {...register('date')}
        />

        {/* Recurring Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-sm font-medium text-text-primary">Recurring Expense</p>
              <p className="text-xs text-text-muted">Repeat this expense automatically</p>
            </div>
          </div>
          <Controller
            name="isRecurring"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors duration-200',
                  field.value ? 'bg-casha-primary' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm',
                    field.value && 'translate-x-5'
                  )}
                />
              </button>
            )}
          />
        </div>

        {/* Recurring Interval */}
        {isRecurring && (
          <div className="space-y-1.5 animate-in slide-in-up">
            <label className="text-sm font-medium text-text-primary">
              Repeat Every
            </label>
            <Controller
              name="recurringInterval"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || ''}
                  placeholder="Select frequency"
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                />
              )}
            />
          </div>
        )}

        {/* Bill Toggle - Only show when recurring is enabled */}
        {isRecurring && (
          <div className="flex items-center justify-between py-2 animate-in slide-in-up">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-text-muted" />
              <div>
                <p className="text-sm font-medium text-text-primary">Mark as Bill</p>
                <p className="text-xs text-text-muted">Set due date and get reminders</p>
              </div>
            </div>
            <Controller
              name="isBill"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200',
                    field.value ? 'bg-casha-primary' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm',
                      field.value && 'translate-x-5'
                    )}
                  />
                </button>
              )}
            />
          </div>
        )}

        {/* Bill Due Date and Reminder Settings */}
        {isRecurring && isBill && (
          <div className="space-y-4 animate-in slide-in-up p-3 bg-surface-muted rounded-bento-sm">
            <div className="flex items-center gap-2 text-sm text-casha-primary">
              <Bell className="h-4 w-4" />
              <span className="font-medium">Bill Reminder Settings</span>
            </div>

            {/* Due Day */}
            <FormField
              label="Due Day of Month"
              type="number"
              min={1}
              max={31}
              placeholder="e.g., 15"
              leftIcon={<Calendar className="h-4 w-4" />}
              error={errors.dueDay?.message}
              {...register('dueDay')}
            />

            {/* Reminder Days */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Remind Me
              </label>
              <Controller
                name="reminderDays"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={String(field.value || 3)}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    options={[
                      { value: '1', label: '1 day before' },
                      { value: '2', label: '2 days before' },
                      { value: '3', label: '3 days before' },
                      { value: '5', label: '5 days before' },
                      { value: '7', label: '1 week before' },
                    ]}
                  />
                )}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Add Expense'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
