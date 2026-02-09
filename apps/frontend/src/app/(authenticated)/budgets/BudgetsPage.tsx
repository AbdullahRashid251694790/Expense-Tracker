/**
 * Budgets Page
 * Budget management and progress tracking with CRUD operations
 */

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Tag, Wallet, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BentoCard, Button, BudgetProgress, Badge, Modal, ModalFooter, Select, Skeleton } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { CategoryModal, IncomeSourceModal } from '@/components/organisms';
import { useBudgets } from '@/lib/hooks/useBudgets';
import { useCategories } from '@/lib/hooks/useCategories';
import { useIncome } from '@/lib/hooks/useIncome';
import { useCurrency } from '@/lib/context/CurrencyContext';
import type { BudgetWithProgress, Category, IncomeSource } from '@casha/shared';

// Budget form schema
const budgetSchema = z.object({
  categoryId: z.string().optional(),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  period: z.enum(['weekly', 'monthly']),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export function BudgetsPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetWithProgress | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { formatCurrency, currencySymbol } = useCurrency();

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  // Income modal state
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [editIncomeSource, setEditIncomeSource] = useState<IncomeSource | null>(null);
  const [deleteIncomeId, setDeleteIncomeId] = useState<string | null>(null);

  const {
    overallBudget,
    categoryBudgets,
    isLoading,
    error,
    refetch,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useBudgets();

  const { categories, isLoading: categoriesLoading, deleteCategory } = useCategories();

  const {
    incomeSources,
    totalMonthlyIncome,
    isLoading: incomeLoading,
    deleteIncomeSource,
    refetch: refetchIncome,
  } = useIncome();

  // Get categories that don't have budgets yet
  const availableCategories = categories.filter(
    (cat) => !categoryBudgets.some((b) => b.categoryId === cat.id)
  );

  // Form for add/edit
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      amount: '',
      period: 'monthly',
    },
  });

  // Open edit modal
  const handleEdit = (budget: BudgetWithProgress) => {
    setEditBudget(budget);
    setValue('categoryId', budget.categoryId ? String(budget.categoryId) : '');
    setValue('amount', String(budget.amount));
    setValue('period', budget.period as 'weekly' | 'monthly');
  };

  // Handle form submit (create or update)
  const onSubmit = async (data: BudgetFormData) => {
    try {
      const budgetData = {
        categoryId: data.categoryId || null,
        amount: parseFloat(data.amount),
        period: data.period,
      };

      if (editBudget) {
        await updateBudget(editBudget.id, budgetData);
        toast.success('Budget updated successfully');
        setEditBudget(null);
      } else {
        await createBudget(budgetData);
        toast.success('Budget created successfully');
        setAddModalOpen(false);
      }
      reset();
    } catch {
      toast.error(editBudget ? 'Failed to update budget' : 'Failed to create budget');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id);
      toast.success('Budget deleted successfully');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  // Close modals
  const handleCloseModal = () => {
    setAddModalOpen(false);
    setEditBudget(null);
    reset();
  };

  // Category handlers
  const handleEditCategory = (category: Category) => {
    setEditCategory(category);
    setCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setCategoryModalOpen(false);
    setEditCategory(null);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success('Category deleted successfully');
      setDeleteCategoryId(null);
    } catch {
      toast.error('Failed to delete category');
    }
  };

  // Income handlers
  const handleEditIncomeSource = (source: IncomeSource) => {
    setEditIncomeSource(source);
    setIncomeModalOpen(true);
  };

  const handleCloseIncomeModal = () => {
    setIncomeModalOpen(false);
    setEditIncomeSource(null);
  };

  const handleDeleteIncomeSource = async (id: string) => {
    try {
      await deleteIncomeSource(id);
      toast.success('Income source deleted successfully');
      setDeleteIncomeId(null);
    } catch {
      toast.error('Failed to delete income source');
    }
  };

  // Format frequency for display
  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return '/mo';
      case 'yearly':
        return '/yr';
      case 'one-time':
        return 'once';
      default:
        return '';
    }
  };

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-error mb-2">Failed to load budgets</p>
        <Button variant="secondary" size="sm" onClick={refetch}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Budgets</h1>
          <p className="text-text-secondary mt-1">
            Set and track your spending limits
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/subscriptions" className="lg:hidden">
            <Button
              variant="secondary"
              leftIcon={<CreditCard className="h-4 w-4" />}
            >
              Subscriptions
            </Button>
          </Link>
          <Button
            variant="secondary"
            leftIcon={<Tag className="h-4 w-4" />}
            onClick={() => setCategoryModalOpen(true)}
          >
            Add Category
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setAddModalOpen(true)}
          >
            Add Budget
          </Button>
        </div>
      </div>

      {/* Monthly Income Section */}
      <BentoCard className="p-6 bg-gradient-to-r from-success/5 to-transparent border-success/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-bento-sm bg-success/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Monthly Income</h2>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(totalMonthlyIncome)}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIncomeModalOpen(true)}
          >
            Add Source
          </Button>
        </div>

        {incomeLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-36 flex-shrink-0 rounded-bento-sm" />
            ))}
          </div>
        ) : incomeSources.length === 0 ? (
          <div
            className="border-2 border-dashed border-success/30 rounded-bento-sm p-4 text-center cursor-pointer hover:border-success/50 transition-colors"
            onClick={() => setIncomeModalOpen(true)}
          >
            <p className="text-text-muted text-sm">No income sources added yet</p>
            <p className="text-text-muted text-xs mt-1">Click to add your first income source</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {incomeSources.map((source) => (
              <div
                key={source.id}
                className="flex-shrink-0 bg-surface-secondary rounded-bento-sm p-3 min-w-[140px] group relative"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text-primary truncate max-w-[100px]">
                    {source.name}
                  </span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEditIncomeSource(source)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteIncomeId(source.id)}
                      className="text-text-muted hover:text-error"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-lg font-bold text-text-primary">
                  {formatCurrency(source.amount)}
                  <span className="text-xs font-normal text-text-muted ml-1">
                    {formatFrequency(source.frequency)}
                  </span>
                </p>
              </div>
            ))}
            <div
              className="flex-shrink-0 border-2 border-dashed border-border rounded-bento-sm p-3 min-w-[100px] flex items-center justify-center cursor-pointer hover:border-success/50 transition-colors"
              onClick={() => setIncomeModalOpen(true)}
            >
              <Plus className="h-5 w-5 text-text-muted" />
            </div>
          </div>
        )}
      </BentoCard>

      {/* Overall Budget - Featured Card */}
      {isLoading ? (
        <BentoCard className="p-6 border-2 border-casha-primary/20">
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
        </BentoCard>
      ) : overallBudget ? (
        <BentoCard className="p-6 border-2 border-casha-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Monthly Budget
              </h2>
              <p className="text-text-secondary text-sm">
                Your total spending limit for this month
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleEdit(overallBudget)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteConfirmId(overallBudget.id)}
                className="text-text-muted hover:text-error"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-text-muted">Budget</p>
              <p className="text-2xl font-bold text-text-primary">
                {formatCurrency(overallBudget.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Spent</p>
              <p className="text-2xl font-bold text-error">
                {formatCurrency(overallBudget.spent)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Remaining</p>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(overallBudget.remaining)}
              </p>
            </div>
          </div>

          <BudgetProgress
            spent={overallBudget.spent}
            budget={overallBudget.amount}
            showAmounts={false}
            size="lg"
          />
        </BentoCard>
      ) : (
        <BentoCard
          className="p-6 border-2 border-dashed border-casha-primary/30 cursor-pointer hover:border-casha-primary/50"
          onClick={() => {
            setValue('categoryId', '');
            setAddModalOpen(true);
          }}
        >
          <div className="text-center py-4">
            <Plus className="h-10 w-10 mx-auto mb-2 text-casha-primary/50" />
            <h2 className="text-lg font-semibold text-text-primary">
              Set Overall Budget
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              Click to create your monthly spending limit
            </p>
          </div>
        </BentoCard>
      )}

      {/* Category Budgets */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Category Budgets
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <BentoCard key={i} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-bento-sm" />
                  <div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </BentoCard>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryBudgets.map((budget) => {
              const percentage = budget.percentage;
              const categoryColor = categories.find(c => c.id === budget.categoryId)?.color || '#6B7280';

              return (
                <BentoCard key={budget.id} className="p-4 group" hover="lift">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-bento-sm flex items-center justify-center"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: categoryColor }}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary">
                          {budget.category?.name || 'Category'}
                        </h3>
                        <p className="text-sm text-text-muted">
                          {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          percentage >= 100
                            ? 'error'
                            : percentage >= 80
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {budget.status === 'exceeded'
                          ? 'Exceeded'
                          : `${formatCurrency(budget.remaining)} left`}
                      </Badge>

                      {/* Edit/Delete buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(budget)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteConfirmId(budget.id)}
                          className="text-text-muted hover:text-error"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <BudgetProgress
                    spent={budget.spent}
                    budget={budget.amount}
                    showAmounts={false}
                    size="md"
                  />
                </BentoCard>
              );
            })}

            {/* Add New Budget Card */}
            {availableCategories.length > 0 && (
              <BentoCard
                className="p-4 border-2 border-dashed border-border hover:border-casha-primary/50 cursor-pointer"
                hover="lift"
                onClick={() => setAddModalOpen(true)}
              >
                <div className="h-full flex flex-col items-center justify-center py-6 text-text-muted hover:text-casha-primary transition-colors">
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="font-medium">Add Category Budget</span>
                </div>
              </BentoCard>
            )}
          </div>
        )}

        {!isLoading && categoryBudgets.length === 0 && availableCategories.length > 0 && (
          <div className="text-center py-8 text-text-muted">
            <p>No category budgets yet</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setAddModalOpen(true)}
              className="mt-2"
            >
              Create your first category budget
            </Button>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Categories
          </h2>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCategoryModalOpen(true)}
          >
            Add Category
          </Button>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 rounded-bento-sm" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <BentoCard
            className="p-6 border-2 border-dashed border-border cursor-pointer hover:border-casha-primary/50"
            onClick={() => setCategoryModalOpen(true)}
          >
            <div className="text-center py-4">
              <Tag className="h-8 w-8 mx-auto mb-2 text-text-muted" />
              <p className="text-text-secondary">No categories yet</p>
              <p className="text-sm text-text-muted">Create your first category to start tracking expenses</p>
            </div>
          </BentoCard>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map((category) => (
              <BentoCard key={category.id} className="p-3 group" hover="lift">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium text-text-primary truncate">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteCategoryId(category.id)}
                      className="text-text-muted hover:text-error"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="mt-1">
                  <Badge variant={category.type === 'expense' ? 'warning' : 'success'} size="sm">
                    {category.type}
                  </Badge>
                </div>
              </BentoCard>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Budget Modal */}
      <Modal
        isOpen={addModalOpen || editBudget !== null}
        onClose={handleCloseModal}
        title={editBudget ? 'Edit Budget' : 'Add Budget'}
        description={editBudget ? 'Update your budget settings' : 'Set a spending limit for a category'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Category Selection - only for new budgets */}
          {!editBudget && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Category (leave empty for overall budget)
              </label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Overall Budget"
                    options={[
                      { value: '', label: 'Overall Budget (All Categories)' },
                      ...availableCategories.map((cat) => ({
                        value: String(cat.id),
                        label: cat.name,
                      })),
                    ]}
                  />
                )}
              />
            </div>
          )}

          {/* Amount */}
          <FormField
            label="Budget Amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            leftIcon={<span className="text-sm font-medium">{currencySymbol}</span>}
            error={errors.amount?.message}
            {...register('amount')}
          />

          {/* Period */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              Budget Period
            </label>
            <Controller
              name="period"
              control={control}
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

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editBudget ? 'Update Budget' : 'Create Budget'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Budget"
        description="Are you sure you want to delete this budget? This action cannot be undone."
        size="sm"
      >
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>

      {/* Category Modal */}
      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={handleCloseCategoryModal}
        editCategory={editCategory}
      />

      {/* Delete Category Confirmation Modal */}
      <Modal
        isOpen={deleteCategoryId !== null}
        onClose={() => setDeleteCategoryId(null)}
        title="Delete Category"
        description="Are you sure you want to delete this category? Expenses using this category will show as 'Unknown'."
        size="sm"
      >
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteCategoryId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteCategoryId && handleDeleteCategory(deleteCategoryId)}
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>

      {/* Income Source Modal */}
      <IncomeSourceModal
        isOpen={incomeModalOpen}
        onClose={handleCloseIncomeModal}
        editSource={editIncomeSource}
        onSuccess={refetchIncome}
      />

      {/* Delete Income Source Confirmation Modal */}
      <Modal
        isOpen={deleteIncomeId !== null}
        onClose={() => setDeleteIncomeId(null)}
        title="Delete Income Source"
        description="Are you sure you want to delete this income source? This action cannot be undone."
        size="sm"
      >
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteIncomeId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteIncomeId && handleDeleteIncomeSource(deleteIncomeId)}
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
