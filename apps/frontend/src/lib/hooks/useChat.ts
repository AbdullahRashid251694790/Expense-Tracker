/**
 * useChat Hook
 * Handles chat state with API polling and streaming responses
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { chatRepository, budgetsRepository, expensesRepository } from '@/lib/api/repositories';
import { usePolling } from './usePolling';
import { useAuth } from '@/lib/context/AuthContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import type { ChatConversation, ChatMessage, ExpenseWithCategory, BudgetWithProgress } from '@casha/shared';

// Polling intervals
const CONVERSATIONS_POLLING_INTERVAL = 60 * 1000; // 1 minute
const MESSAGES_POLLING_INTERVAL = 10 * 1000; // 10 seconds when viewing

/**
 * Generate a smart title from the user's first message
 * Extracts the main topic or question for a cleaner title
 */
function generateConversationTitle(message: string): string {
  const trimmed = message.trim();

  // Remove common filler words at the start
  const fillerPatterns = [
    /^(hey|hi|hello|please|can you|could you|would you|i want to|i need to|i'd like to|help me|tell me|show me|explain)\s+/i,
    /^(what|how|why|when|where|which|who)\s+(is|are|do|does|can|could|should|would|will)\s+/i,
  ];

  let cleaned = trimmed;
  for (const pattern of fillerPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // If cleaning removed too much, use original
  if (cleaned.length < 10) {
    cleaned = trimmed;
  }

  // Capitalize first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  // Remove trailing punctuation for cleaner look
  cleaned = cleaned.replace(/[?.!,]+$/, '');

  // Truncate to 50 chars with ellipsis
  if (cleaned.length > 50) {
    // Try to break at a word boundary
    const truncated = cleaned.slice(0, 50);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 30) {
      return truncated.slice(0, lastSpace) + '...';
    }
    return truncated + '...';
  }

  return cleaned;
}

interface UseChatReturn {
  conversations: ChatConversation[];
  messages: ChatMessage[];
  currentConversationId: string | null;
  streamingContent: string;
  isStreaming: boolean;
  isLoading: boolean;
  error: Error | null;
  sendMessage: (message: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  startNewConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
}

export function useChat(): UseChatReturn {
  const { user } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Financial context for RAG
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);

  const messagesPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for conversations list
  const {
    data: conversations,
    refetch: refetchConversations,
  } = usePolling<ChatConversation[]>({
    fetchFn: () => chatRepository.getConversationsFresh(),
    interval: CONVERSATIONS_POLLING_INTERVAL,
    enabled: !!user,
    key: user?.id,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Clear chat state when user changes
  useEffect(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setStreamingContent('');
    setError(null);
    setExpenses([]);
    setBudgets([]);
  }, [user?.id]);

  // Fetch expenses and budgets for context
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setBudgets([]);
      return;
    }

    const fetchContext = async () => {
      try {
        const [expensesData, budgetsData] = await Promise.all([
          expensesRepository.getExpensesFresh({ pageSize: 100 }),
          budgetsRepository.getBudgetsFresh(),
        ]);
        setExpenses(expensesData.data || []);
        setBudgets(budgetsData || []);
      } catch (err) {
        console.error('Failed to fetch context data:', err);
      }
    };

    fetchContext();
    // Refresh context every 2 minutes
    const contextInterval = setInterval(fetchContext, 2 * 60 * 1000);

    return () => clearInterval(contextInterval);
  }, [user]);

  // Calculate spending summary for context
  const calculateSpendingSummary = useCallback(
    (expenseList: ExpenseWithCategory[], overallBudget: BudgetWithProgress | null) => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthExpenses = expenseList.filter((e) => {
        const date = new Date(e.date);
        return date >= monthStart && date <= monthEnd;
      });

      const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalBudget = overallBudget?.amount || 0;
      const remaining = totalBudget - totalSpent;
      const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      return { totalSpent, totalBudget, remaining, percentageUsed };
    },
    []
  );

  // Build context for AI
  const buildContext = useCallback(() => {
    if (expenses.length === 0) return undefined;

    // Get overall budget (the one with null categoryId)
    const overallBudget = budgets.find((b) => b.categoryId === null) || null;
    const summary = calculateSpendingSummary(expenses, overallBudget);

    // Simple category spending calculation
    const categoryMap = new Map<string, number>();
    expenses.forEach((e) => {
      const existing = categoryMap.get(e.categoryId) || 0;
      categoryMap.set(e.categoryId, existing + e.amount);
    });
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categorySpending = Array.from(categoryMap.entries())
      .map(([categoryId, amount]) => {
        const expense = expenses.find((e) => e.categoryId === categoryId);
        return {
          name: expense?.category?.name || categoryId,
          amount,
          percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Get recent expenses (last 10)
    const recentExpenses = [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((e) => ({
        description: e.description || 'Expense',
        amount: e.amount,
        category: e.category?.name || e.categoryId,
        date: new Date(e.date).toLocaleDateString(),
      }));

    return {
      totalSpent: summary.totalSpent,
      totalBudget: summary.totalBudget,
      remaining: summary.remaining,
      topCategories: categorySpending.slice(0, 5),
      recentExpenses,
      spendingTrend:
        summary.percentageUsed > 80
          ? ('up' as const)
          : summary.percentageUsed < 50
            ? ('down' as const)
            : ('stable' as const),
      currency,
      currencySymbol,
    };
  }, [expenses, budgets, calculateSpendingSummary, currency, currencySymbol]);

  // Start polling for messages when viewing a conversation
  const startMessagesPolling = useCallback((conversationId: string) => {
    // Clear any existing polling
    if (messagesPollingRef.current) {
      clearInterval(messagesPollingRef.current);
    }

    // Fetch messages immediately
    const fetchMessages = async () => {
      try {
        const result = await chatRepository.getConversation(conversationId);
        setMessages(result.messages);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    fetchMessages();

    // Start polling
    messagesPollingRef.current = setInterval(fetchMessages, MESSAGES_POLLING_INTERVAL);
  }, []);

  // Stop messages polling
  const stopMessagesPolling = useCallback(() => {
    if (messagesPollingRef.current) {
      clearInterval(messagesPollingRef.current);
      messagesPollingRef.current = null;
    }
  }, []);

  // Load a conversation
  const loadConversation = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);
        stopMessagesPolling();

        setCurrentConversationId(id);

        // Fetch conversation with messages
        const result = await chatRepository.getConversation(id);
        setMessages(result.messages);

        // Start polling for messages
        startMessagesPolling(id);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load conversation'));
      } finally {
        setIsLoading(false);
      }
    },
    [startMessagesPolling, stopMessagesPolling]
  );

  const startNewConversation = useCallback(() => {
    stopMessagesPolling();
    setCurrentConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setError(null);
  }, [stopMessagesPolling]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (isStreaming) return;

      const trimmedMessage = message.trim();
      if (!trimmedMessage) return;

      setError(null);
      setIsStreaming(true);
      setStreamingContent('');

      let conversationId = currentConversationId;

      try {
        // Create a new conversation if needed
        if (!conversationId) {
          const newConversation = await chatRepository.createConversation('New Conversation');
          conversationId = newConversation.id;
          setCurrentConversationId(conversationId);
          await refetchConversations();
        }

        // Add user message to backend
        await chatRepository.addMessage(conversationId, 'user', trimmedMessage);

        // Refresh messages to show user message
        const result = await chatRepository.getConversation(conversationId);
        setMessages(result.messages);

        // Build history from current messages
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Add the new user message to history
        history.push({ role: 'user', content: trimmedMessage });

        // Build context with user's financial data
        const context = buildContext();

        let fullContent = '';

        // Stream AI response with context
        await chatRepository.sendMessageStream(
          {
            message: trimmedMessage,
            conversationId,
            history,
            context,
          },
          {
            onMessage: (content) => {
              fullContent += content;
              setStreamingContent(fullContent);
            },
            onDone: async (fullResponse) => {
              // Save assistant response to backend
              await chatRepository.addMessage(conversationId!, 'assistant', fullResponse);

              // Update conversation title if it's the first message
              if (messages.length === 0) {
                const title = generateConversationTitle(trimmedMessage);
                await chatRepository.updateConversationTitle(conversationId!, title);
                await refetchConversations();
              }

              // Refresh messages to show assistant message
              const updatedResult = await chatRepository.getConversation(conversationId!);
              setMessages(updatedResult.messages);

              setStreamingContent('');
              setIsStreaming(false);

              // Start polling for this conversation
              startMessagesPolling(conversationId!);
            },
            onError: (errorMessage) => {
              setError(new Error(errorMessage));
              setIsStreaming(false);
            },
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to send message'));
        setIsStreaming(false);
      }
    },
    [
      currentConversationId,
      isStreaming,
      messages,
      buildContext,
      refetchConversations,
      startMessagesPolling,
    ]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await chatRepository.deleteConversation(id);
        await refetchConversations();

        // If deleting current conversation, start new one
        if (currentConversationId === id) {
          startNewConversation();
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete conversation'));
      }
    },
    [currentConversationId, startNewConversation, refetchConversations]
  );

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      try {
        await chatRepository.updateConversationTitle(id, title);
        await refetchConversations();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to rename conversation'));
      }
    },
    [refetchConversations]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMessagesPolling();
    };
  }, [stopMessagesPolling]);

  return {
    conversations: conversations || [],
    messages,
    currentConversationId,
    streamingContent,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    loadConversation,
    startNewConversation,
    deleteConversation,
    renameConversation,
  };
}
