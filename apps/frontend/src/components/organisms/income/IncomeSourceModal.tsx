/**
 * IncomeSourceModal Organism
 * Modal form for creating and editing income sources
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase } from 'lucide-react';
import { toast } from 'sonner';

import { Modal, ModalFooter, Button, Select } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useIncome } from '@/lib/hooks/useIncome';
import { useCurrency } from '@/lib/context/CurrencyContext';
import type { IncomeSource } from '@casha/shared';

const incomeSourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  frequency: z.enum(['monthly', 'yearly', 'one-time']),
});

type IncomeSourceFormData = z.infer<typeof incomeSourceSchema>;

interface IncomeSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editSource?: IncomeSource | null;
  onSuccess?: () => void;
}

export function IncomeSourceModal({
  isOpen,
  onClose,
  editSource,
  onSuccess,
}: IncomeSourceModalProps) {
  const { createIncomeSource, updateIncomeSource } = useIncome();
  const { currencySymbol } = useCurrency();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IncomeSourceFormData>({
    resolver: zodResolver(incomeSourceSchema),
    defaultValues: {
      name: '',
      amount: '',
      frequency: 'monthly',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editSource) {
      setValue('name', editSource.name);
      setValue('amount', String(editSource.amount));
      setValue('frequency', editSource.frequency);
    }
  }, [editSource, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset({
        name: '',
        amount: '',
        frequency: 'monthly',
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: IncomeSourceFormData) => {
    try {
      const incomeData = {
        name: data.name,
        amount: parseFloat(data.amount),
        frequency: data.frequency,
      };

      if (editSource) {
        await updateIncomeSource(editSource.id, incomeData);
        toast.success('Income source updated successfully!');
      } else {
        await createIncomeSource(incomeData);
        toast.success('Income source added successfully!');
      }
      reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editSource
          ? 'Failed to update income source'
          : 'Failed to add income source'
      );
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
      title={editSource ? 'Edit Income Source' : 'Add Income Source'}
      description={
        editSource
          ? 'Update your income source details'
          : 'Add a new source of income to track your earnings'
      }
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <FormField
          label="Source Name"
          placeholder="e.g., Salary, Freelance, Rental Income"
          leftIcon={<Briefcase className="h-4 w-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

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

        {/* Frequency */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">
            Frequency <span className="text-error">*</span>
          </label>
          <Controller
            name="frequency"
            control={control}
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
          <p className="text-xs text-text-muted">
            {errors.frequency?.message ||
              'Select how often you receive this income'}
          </p>
        </div>

        {/* Footer Actions */}
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {editSource ? 'Update Source' : 'Add Source'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
