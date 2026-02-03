/**
 * CategoryModal Organism
 * Modal form for creating and editing categories
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Type } from 'lucide-react';
import { toast } from 'sonner';

import { Modal, ModalFooter, Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useCategories } from '@/lib/hooks/useCategories';
import { cn } from '@/lib/utils/cn';
import type { Category } from '@casha/shared';

// Preset colors for category selection
const PRESET_COLORS = [
  { value: '#F97316', label: 'Orange' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#EF4444', label: 'Red' },
  { value: '#22C55E', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#6B7280', label: 'Gray' },
];

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(30, 'Name must be 30 characters or less'),
  color: z.string().min(1, 'Color is required'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCategory?: Category | null;
  onSuccess?: () => void;
}

export function CategoryModal({ isOpen, onClose, editCategory, onSuccess }: CategoryModalProps) {
  const { createCategory, updateCategory } = useCategories();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: PRESET_COLORS[0].value,
    },
  });

  const selectedColor = watch('color');

  // Populate form when editing
  useEffect(() => {
    if (editCategory) {
      setValue('name', editCategory.name);
      setValue('color', editCategory.color);
    }
  }, [editCategory, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset({
        name: '',
        color: PRESET_COLORS[0].value,
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editCategory) {
        await updateCategory(editCategory.id, {
          name: data.name,
          color: data.color,
          type: 'expense',
        });
        toast.success('Category updated successfully!');
      } else {
        await createCategory({
          name: data.name,
          color: data.color,
          type: 'expense',
        });
        toast.success('Category created successfully!');
      }
      reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editCategory
          ? 'Failed to update category'
          : 'Failed to create category'
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
      title={editCategory ? 'Edit Category' : 'Add Category'}
      description={editCategory ? 'Update your category settings' : 'Create a new spending category'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <FormField
          label="Name"
          placeholder="e.g., Groceries, Rent, Salary"
          leftIcon={<Type className="h-4 w-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Color Selection */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">
            Color <span className="text-error">*</span>
          </label>
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => field.onChange(color.value)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all duration-200',
                      'ring-2 ring-offset-2 ring-offset-surface-primary',
                      selectedColor === color.value
                        ? 'ring-casha-primary scale-110'
                        : 'ring-transparent hover:ring-border'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            )}
          />
          {errors.color && (
            <p className="text-xs text-error">{errors.color.message}</p>
          )}
        </div>

        {/* Preview */}
        <div className="p-3 bg-surface-secondary rounded-bento-sm">
          <p className="text-xs text-text-muted mb-2">Preview</p>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-sm font-medium text-text-primary">
              {watch('name') || 'Category Name'}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {editCategory ? 'Update Category' : 'Create Category'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
