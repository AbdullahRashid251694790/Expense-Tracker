/**
 * Chat Repository
 * CRUD operations for conversations and messages + SSE streaming
 */

import { BaseRepository } from './BaseRepository';
import { getApiUrl, ApiError } from '../client';
import type { ChatConversation, ChatMessage } from '@casha/shared';

// Cache TTLs
const CONVERSATIONS_CACHE_TTL = 60 * 1000; // 1 minute
const MESSAGES_CACHE_TTL = 10 * 1000; // 10 seconds

interface StreamCallbacks {
  onMessage?: (content: string) => void;
  onDone?: (fullResponse: string) => void;
  onError?: (error: string) => void;
}

interface UserContext {
  totalSpent?: number;
  totalBudget?: number;
  remaining?: number;
  topCategories?: Array<{ name: string; amount: number; percentage: number }>;
  recentExpenses?: Array<{ description: string; amount: number; category: string; date: string }>;
  spendingTrend?: 'up' | 'down' | 'stable';
  currency?: string;
  currencySymbol?: string;
}

interface SendMessageRequest {
  message: string;
  conversationId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: UserContext;
}

 interface ConversationWithMessages {
  conversation: ChatConversation;
  messages: ChatMessage[];
}

class ChatRepositoryClass extends BaseRepository {
  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get all conversations (with caching)
   */
  async getConversations(): Promise<ChatConversation[]> {
    return this.getWithCache<ChatConversation[]>(
      '/api/chat/conversations',
      'chat:conversations',
      CONVERSATIONS_CACHE_TTL
    );
  }

  /**
   * Get all conversations without caching
   */
  async getConversationsFresh(): Promise<ChatConversation[]> {
    return this.get<ChatConversation[]>('/api/chat/conversations');
  }

  /**
   * Get a single conversation with messages (with caching)
   */
  async getConversation(id: string): Promise<ConversationWithMessages> {
    return this.getWithCache<ConversationWithMessages>(
      `/api/chat/conversations/${id}`,
      `chat:conversation:${id}`,
      MESSAGES_CACHE_TTL
    );
  }

  /**
   * Create a new conversation
   */
  async createConversation(title?: string): Promise<ChatConversation> {
    const result = await this.post<ChatConversation>('/api/chat/conversations', { title });
    await this.invalidateCache(['chat:conversations']);
    return result;
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(id: string, title: string): Promise<ChatConversation> {
    const result = await this.put<ChatConversation>(`/api/chat/conversations/${id}`, { title });
    await this.invalidateCache(['chat:conversations', `chat:conversation:${id}`]);
    return result;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    await this.delete(`/api/chat/conversations/${id}`);
    await this.invalidateCache(['chat:conversations', `chat:conversation:${id}`]);
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<ChatMessage> {
    const result = await this.post<ChatMessage>(`/api/chat/conversations/${conversationId}/messages`, {
      role,
      content,
    });
    await this.invalidateCache([`chat:conversation:${conversationId}`]);
    return result;
  }

  /**
   * Send message and stream response via SSE
   * Client sends conversation history, server streams AI response
   */
  async sendMessageStream(
    request: SendMessageRequest,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const token = this.getAuthToken();

    if (!token) {
      callbacks.onError?.('Not authenticated');
      return;
    }

    const response = await fetch(`${getApiUrl()}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError('Session expired', 401, 'Please log in again');
      }
      throw new ApiError('Failed to send message', response.status);
    }

    if (!response.body) {
      throw new ApiError('No response body', 0);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    let currentEvent = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('event: ')) {
          currentEvent = trimmedLine.slice(7).trim();
        } else if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6);

          try {
            const data = JSON.parse(dataStr);

            if (currentEvent === 'message' || (!currentEvent && data.content)) {
              fullResponse += data.content || '';
              callbacks.onMessage?.(data.content);
            } else if (currentEvent === 'done') {
              callbacks.onDone?.(data.fullResponse || fullResponse);
            } else if (currentEvent === 'error') {
              callbacks.onError?.(data.message || 'Unknown error');
            }
          } catch {
            // Skip malformed JSON
          }

          // Reset event after processing data
          currentEvent = '';
        }
      }
    }
  }
}

// Export singleton instance
export const chatRepository = new ChatRepositoryClass();
