/**
 * Chat Page
 * GPT-like AI chat interface for finance conversations
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Sparkles,
  DollarSign,
  PiggyBank,
  TrendingUp,
  WifiOff,
  MessageSquarePlus,
  History,
  Trash2,
  X,
  PanelLeftClose,
  Pencil,
  Check,
  Bot,
  User,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button, Input, Spinner } from '@/components/atoms';
import { useChat } from '@/lib/hooks';
import { useNetwork } from '@/lib/context/NetworkContext';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { cn } from '@/lib/utils/cn';
import type { ChatMessage, ChatConversation } from '@casha/shared';

const QUICK_SUGGESTIONS = [
  { icon: DollarSign, text: 'How can I reduce my monthly expenses?' },
  { icon: PiggyBank, text: 'Tips for building an emergency fund' },
  { icon: TrendingUp, text: 'How should I start investing?' },
];

export function ChatPage() {
  const {
    conversations,
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
  } = useChat();
  const { isOnline } = useNetwork();

  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();

  // Auto-scroll to bottom only when streaming or user sends a message
  useEffect(() => {
    if (shouldAutoScroll && (isStreaming || streamingContent)) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingContent, isStreaming, shouldAutoScroll]);

  // Track scroll position to determine if user is at bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming || !isOnline) return;
    const message = input;
    setInput('');
    setShouldAutoScroll(true); // Enable auto-scroll when user sends message
    await sendMessage(message);
  }, [input, isStreaming, isOnline, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    startNewConversation();
    setShowSidebar(false);
  };

  const handleSelectConversation = (id: string) => {
    loadConversation(id);
    setShowSidebar(false);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(id);
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    await renameConversation(id, newTitle);
  };

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div className="h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] flex animate-in slide-in-up">
      {/* Sidebar Overlay (mobile only) */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Conversation Sidebar */}
      <div
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-72 bg-surface border-r border-border flex flex-col transition-transform duration-200',
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-text-muted" />
            <h2 className="font-semibold text-text-primary">Chat History</h2>
          </div>
          <button
            onClick={() => setShowSidebar(false)}
            className="p-1 hover:bg-surface-muted rounded-md transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            variant="primary"
            fullWidth
            onClick={handleNewChat}
            className="flex items-center justify-center gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === currentConversationId}
                onClick={() => handleSelectConversation(conv.id)}
                onDelete={(e) => handleDeleteConversation(conv.id, e)}
                onRename={(newTitle) => handleRenameConversation(conv.id, newTitle)}
              />
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* History Toggle Button - Floating Left */}
        <button
          onClick={() => setShowSidebar(true)}
          className={cn(
            "absolute top-4 left-4 z-10 p-2 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded-lg transition-colors",
            showSidebar && "opacity-0 pointer-events-none"
          )}
          title="View chat history"
        >
          <History className="h-5 w-5" />
        </button>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : isEmpty ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center p-6">
              <div className="p-4 bg-casha-primary/10 rounded-full mb-4">
                <Sparkles className="h-8 w-8 text-casha-primary" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Casha AI
              </h2>
              <p className="text-text-secondary text-center max-w-md mb-8">
                Your personal finance assistant. Ask me about budgeting, saving money, investments, or expense tracking.
              </p>

              {/* Quick Suggestions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
                {QUICK_SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-bento-sm border border-border',
                      'hover:bg-surface-muted hover:border-border-hover transition-colors',
                      'text-left text-sm text-text-secondary'
                    )}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                  >
                    <suggestion.icon className="h-4 w-4 text-casha-primary flex-shrink-0" />
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="p-4 pr-6 space-y-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Streaming Message */}
              {streamingContent && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-casha-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-casha-primary" />
                  </div>
                  <div className="flex-1 prose prose-sm dark:prose-invert max-w-none text-text-primary">
                    <ReactMarkdown
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match && !String(children).includes('\n');
                          return isInline ? (
                            <code className="bg-surface-muted px-1.5 py-0.5 rounded text-sm font-mono text-casha-primary" {...props}>
                              {children}
                            </code>
                          ) : (
                            <SyntaxHighlighter style={oneDark} language={match?.[1] || 'text'} PreTag="div" className="rounded-bento-sm !my-2 text-sm">
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          );
                        },
                        p({ children }) {
                          return <p className="mb-3 last:mb-0">{children}</p>;
                        },
                      }}
                    >
                      {streamingContent}
                    </ReactMarkdown>
                    <span className="inline-block w-1.5 h-4 ml-1 bg-casha-primary animate-pulse align-middle" />
                  </div>
                </div>
              )}

              {/* Offline Message */}
              {!isOnline && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-bento-sm flex items-center gap-2">
                  <WifiOff className="h-4 w-4 text-warning" />
                  <p className="text-sm text-warning">Chatbot requires internet connection. You can still view previous conversations.</p>
                </div>
              )}

              {/* Error Message */}
              {error && isOnline && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-bento-sm">
                  <p className="text-sm text-error">{error.message}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Fixed above keyboard when visible, otherwise above navbar */}
        <div
          className={cn(
            "fixed left-0 right-0 z-30 border-t border-border p-4 bg-surface lg:relative lg:bottom-0 lg:z-auto transition-all duration-200",
            !isKeyboardVisible && "bottom-[calc(5rem+env(safe-area-inset-bottom))]",
            isKeyboardVisible && "bottom-0"
          )}
          style={isKeyboardVisible && keyboardHeight > 0 ? { bottom: `${keyboardHeight}px` } : undefined}
        >
          <div className="pr-2">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isOnline ? "Ask about budgeting, saving, investments..." : "Offline - Chatbot unavailable"}
                disabled={isStreaming || !isOnline}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || !isOnline}
                className="rounded-full w-12 h-12 min-w-12 flex-shrink-0"
              >
                {isStreaming ? (
                  <Spinner size="sm" />
                ) : !isOnline ? (
                  <WifiOff className="h-5 w-5" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Message Bubble Component
 * User messages: right-aligned with avatar
 * AI messages: left-aligned with avatar (ChatGPT style)
 */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  // User message - far right with avatar
  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-casha-primary text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[70%]">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center">
          <User className="h-4 w-4 text-text-muted" />
        </div>
      </div>
    );
  }

  // AI message - left aligned with avatar
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-casha-primary/10 flex items-center justify-center">
        <Bot className="h-4 w-4 text-casha-primary" />
      </div>
      <div className="flex-1 prose prose-sm dark:prose-invert max-w-none text-text-primary prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-li:text-text-primary">
        <ReactMarkdown
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !match && !String(children).includes('\n');

              return isInline ? (
                <code
                  className="bg-surface-muted px-1.5 py-0.5 rounded text-sm font-mono text-casha-primary"
                  {...props}
                >
                  {children}
                </code>
              ) : (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match?.[1] || 'text'}
                  PreTag="div"
                  className="rounded-bento-sm !my-2 text-sm"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            },
            ul({ children }) {
              return <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>;
            },
            ol({ children }) {
              return <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>;
            },
            li({ children }) {
              return <li className="text-text-primary">{children}</li>;
            },
            p({ children }) {
              return <p className="mb-3 last:mb-0">{children}</p>;
            },
            strong({ children }) {
              return <strong className="font-semibold text-text-primary">{children}</strong>;
            },
            h1({ children }) {
              return <h1 className="text-lg font-bold mt-4 mb-2 text-text-primary">{children}</h1>;
            },
            h2({ children }) {
              return <h2 className="text-base font-semibold mt-4 mb-2 text-text-primary">{children}</h2>;
            },
            h3({ children }) {
              return <h3 className="text-sm font-semibold mt-3 mb-1 text-text-primary">{children}</h3>;
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

/**
 * Conversation Item Component
 * Displays a single conversation in the sidebar with edit/delete options
 */
function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  onRename,
}: {
  conversation: ChatConversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onRename: (newTitle: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(conversation.title || '');
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveEdit = (e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditTitle(conversation.title || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit(e);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(conversation.title || '');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(e);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  if (isEditing) {
    return (
      <div
        className={cn(
          'w-full p-3 rounded-bento-sm border',
          isActive
            ? 'bg-casha-primary/10 border-casha-primary/20'
            : 'bg-surface-muted border-border'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm bg-surface border border-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-casha-primary"
            placeholder="Conversation name"
          />
          <button
            onClick={handleSaveEdit}
            className="p-1 hover:bg-casha-primary/10 rounded transition-colors"
            title="Save"
          >
            <Check className="h-4 w-4 text-casha-primary" />
          </button>
          <button
            onClick={handleCancelEdit}
            className="p-1 hover:bg-surface-muted rounded transition-colors"
            title="Cancel"
          >
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </div>
      </div>
    );
  }

  // Delete confirmation view
  if (showDeleteConfirm) {
    return (
      <div
        className={cn(
          'w-full p-3 rounded-bento-sm border',
          'bg-error/5 border-error/20'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-text-primary mb-2">Delete this conversation?</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirmDelete}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-error text-white rounded hover:bg-error/90 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={handleCancelDelete}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-surface-muted text-text-primary rounded hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-bento-sm transition-colors group cursor-pointer',
        isActive
          ? 'bg-casha-primary/10 border border-casha-primary/20'
          : 'hover:bg-surface-muted border border-transparent'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium truncate',
              isActive ? 'text-casha-primary' : 'text-text-primary'
            )}
          >
            {conversation.title || 'New Conversation'}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {formatDate(conversation.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={handleEditClick}
            className="p-1 hover:bg-surface-muted rounded"
            title="Rename conversation"
          >
            <Pencil className="h-3.5 w-3.5 text-text-muted" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-1 hover:bg-error/10 rounded"
            title="Delete conversation"
          >
            <Trash2 className="h-3.5 w-3.5 text-error" />
          </button>
        </div>
      </div>
    </div>
  );
}
