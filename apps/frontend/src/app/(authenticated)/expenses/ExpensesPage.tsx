/**
 * Expenses Page
 * Expense list with filters, search, and full CRUD operations
 */

import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Trash2, Pencil, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { BentoCard, Button, Input, Badge, Select, Modal, ModalFooter, Skeleton } from '@/components/atoms';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { useCategories } from '@/lib/hooks/useCategories';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { AddExpenseModal, ReceiptScannerModal } from '@/components/organisms/expenses';
import type { Expense } from '@casha/shared';

export function ExpensesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<{ amount: string; description: string; date: string } | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { formatCurrency } = useCurrency();
  const { categories } = useCategories();
  const {
    expenses,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    refetch,
    deleteExpense,
    setPage,
    setFilters,
  } = useExpenses({
    search: searchQuery || undefined,
    categoryId: selectedCategory || undefined,
    pageSize: 10,
  });

  // Calculate total for displayed expenses
  const displayedTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Handle search with debounce effect
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setFilters({
      search: value || undefined,
      categoryId: selectedCategory || undefined,
    });
    setPage(1);
  };

  // Handle category filter
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setFilters({
      search: searchQuery || undefined,
      categoryId: value || undefined,
    });
    setPage(1);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      toast.success('Expense deleted successfully');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setFilters({});
    setPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCategory;

  return (
    <div className="space-y-6 animate-in slide-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Expenses</h1>
          <p className="text-text-secondary mt-1">
            Track and manage your spending
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={() => setScannerOpen(true)}
            title="Scan Receipt"
          >
            <Camera className="h-6 w-6" />
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setAddModalOpen(true)}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filters */}
      <BentoCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
              {hasActiveFilters && (
                <span className="ml-1 h-2 w-2 rounded-full bg-casha-primary" />
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border animate-in slide-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">
                  Category
                </label>
                <Select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  placeholder="All Categories"
                  options={[
                    { value: '', label: 'All Categories' },
                    ...categories.map((cat) => ({
                      value: String(cat.id),
                      label: cat.name,
                    })),
                  ]}
                />
              </div>
              {/* Add more filters here as needed: date range, amount range, etc. */}
            </div>
          </div>
        )}
      </BentoCard>

      {/* Expenses List */}
      <BentoCard>
        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-bento-sm" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-error mb-2">Failed to load expenses</p>
            <Button variant="secondary" size="sm" onClick={refetch}>
              Try Again
            </Button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-text-muted">
              {hasActiveFilters ? 'No expenses match your filters' : 'No expenses yet'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="link"
                size="sm"
                onClick={clearFilters}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Category Color Dot */}
                  <div
                    className="h-10 w-10 rounded-bento-sm flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${expense.category?.color || '#6B7280'}20` }}
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: expense.category?.color || '#6B7280' }}
                    />
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary truncate">
                      {expense.description || expense.category?.name || 'Expense'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge
                        size="sm"
                        dot
                        dotColor={expense.category?.color || '#6B7280'}
                      >
                        {expense.category?.name || 'Uncategorized'}
                      </Badge>
                      <span className="text-xs text-text-muted">
                        {new Date(expense.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {expense.isRecurring && (
                        <Badge size="sm" variant="info">
                          {expense.recurringInterval}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-text-primary whitespace-nowrap">
                    -{formatCurrency(expense.amount)}
                  </span>

                  {/* Action buttons - visible on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditingExpense(expense)}
                      className="text-text-muted hover:text-casha-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteConfirmId(expense.id)}
                      className="text-text-muted hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-text-muted">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon-sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-text-primary px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="icon-sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </BentoCard>

      {/* Summary Footer */}
      <div className="flex justify-end">
        <BentoCard className="p-4 inline-flex items-center gap-4">
          <span className="text-text-secondary">
            {hasActiveFilters ? 'Filtered Total:' : 'Page Total:'}
          </span>
          <span className="text-xl font-bold text-text-primary">
            {displayedTotal > 0 ? `-${formatCurrency(displayedTotal)}` : formatCurrency(0)}
          </span>
        </BentoCard>
      </div>

      {/* Add/Edit Expense Modal */}
      <AddExpenseModal
        isOpen={addModalOpen || editingExpense !== null}
        onClose={() => {
          setAddModalOpen(false);
          setPrefillData(null);
          setEditingExpense(null);
        }}
        onSuccess={refetch}
        initialValues={prefillData ?? undefined}
        editExpense={editingExpense ?? undefined}
      />

      {/* Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onExtracted={(data) => {
          setPrefillData(data);
          setScannerOpen(false);
          setAddModalOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
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
    </div>
  );
}
