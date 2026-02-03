/**
 * AskBeforeBuyModal Organism
 * AI-powered purchase advisor - helps users decide if a purchase fits their budget
 */

import { useState, useCallback } from 'react';
import { ShoppingBag, Sparkles, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Modal, ModalFooter, Button, Spinner } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { chatRepository } from '@/lib/api/repositories';
import { useDashboardData } from '@/lib/hooks/useInsights';
import { useBudgets } from '@/lib/hooks/useBudgets';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { cn } from '@/lib/utils/cn';

interface AskBeforeBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AskBeforeBuyModal({ isOpen, onClose }: AskBeforeBuyModalProps) {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [advice, setAdvice] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's financial context
  const { summary } = useDashboardData();
  const { overallBudget } = useBudgets();
  const { formatCurrency, currency, currencySymbol } = useCurrency();

  const handleClose = useCallback(() => {
    setItemName('');
    setPrice('');
    setAdvice('');
    setError(null);
    setIsAnalyzing(false);
    onClose();
  }, [onClose]);

  const handleAnalyze = useCallback(async () => {
    if (!itemName.trim() || !price.trim()) return;

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setIsAnalyzing(true);
    setAdvice('');
    setError(null);

    // Build context for AI
    const remaining = summary?.remaining ?? 0;
    const totalBudget = overallBudget?.amount ?? 0;
    const totalSpent = summary?.totalSpent ?? 0;
    const percentUsed = summary?.percentageUsed ?? 0;

    // Create the prompt
    const prompt = `I want to buy "${itemName}" for ${formatCurrency(priceNum)}.

My current financial situation (currency: ${currency}):
- Monthly budget: ${formatCurrency(totalBudget)}
- Already spent: ${formatCurrency(totalSpent)}
- Remaining budget: ${formatCurrency(remaining)}
- Budget used: ${percentUsed.toFixed(0)}%

Should I make this purchase? Give me a brief, direct recommendation (2-3 sentences max) with a clear YES, NO, or MAYBE verdict at the start.`;

    try {
      let fullContent = '';

      await chatRepository.sendMessageStream(
        {
          message: prompt,
          history: [],
          context: {
            totalSpent,
            totalBudget,
            remaining,
            spendingTrend: percentUsed > 80 ? 'up' : percentUsed < 50 ? 'down' : 'stable',
            currency,
            currencySymbol,
          },
        },
        {
          onMessage: (content) => {
            fullContent += content;
            setAdvice(fullContent);
          },
          onDone: () => {
            setIsAnalyzing(false);
          },
          onError: (errorMsg) => {
            setError(errorMsg);
            setIsAnalyzing(false);
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get advice');
      setIsAnalyzing(false);
    }
  }, [itemName, price, summary, overallBudget, formatCurrency, currency, currencySymbol]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && itemName.trim() && price.trim() && !isAnalyzing) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Should I Buy This?"
      description="Let AI analyze if this purchase fits your budget"
      size="md"
    >
      <div className="space-y-4">
        {/* Item Name Input */}
        <FormField
          label="What do you want to buy?"
          placeholder="e.g., New headphones, Coffee machine"
          leftIcon={<ShoppingBag className="h-4 w-4" />}
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Price Input */}
        <FormField
          label="How much does it cost?"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          leftIcon={<span className="text-sm font-medium">{currencySymbol}</span>}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Budget Context */}
        {summary && (
          <div className="p-3 bg-surface-muted rounded-bento-sm">
            <p className="text-xs text-text-muted mb-1">Your current budget status:</p>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Remaining this month:</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(summary.remaining ?? 0)}
              </span>
            </div>
          </div>
        )}

        {/* AI Advice Response */}
        {(advice || isAnalyzing) && (
          <div className={cn(
            'p-4 rounded-bento border',
            advice.toLowerCase().startsWith('yes') && 'bg-success/5 border-success/20',
            advice.toLowerCase().startsWith('no') && 'bg-error/5 border-error/20',
            advice.toLowerCase().startsWith('maybe') && 'bg-warning/5 border-warning/20',
            !advice.toLowerCase().startsWith('yes') &&
            !advice.toLowerCase().startsWith('no') &&
            !advice.toLowerCase().startsWith('maybe') && 'bg-surface-muted border-border'
          )}>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-casha-primary/10 rounded-full flex-shrink-0">
                <Bot className="h-4 w-4 text-casha-primary" />
              </div>
              <div className="flex-1 min-w-0">
                {isAnalyzing && !advice ? (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Spinner size="sm" />
                    <span className="text-sm">Analyzing your purchase...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-text-primary">
                    <ReactMarkdown>{advice}</ReactMarkdown>
                    {isAnalyzing && (
                      <span className="inline-block w-1.5 h-4 ml-1 bg-casha-primary animate-pulse align-middle" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-bento-sm">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Footer Actions */}
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={handleAnalyze}
            disabled={!itemName.trim() || !price.trim() || isAnalyzing}
            isLoading={isAnalyzing}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Analyze Purchase
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
