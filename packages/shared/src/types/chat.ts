/**
 * Chat Types
 * Type definitions for chat feature
 */

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatConversationWithMessages extends ChatConversation {
  messages: ChatMessage[];
}

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface StreamEvent {
  type: 'conversationId' | 'message' | 'done' | 'error';
  data: {
    id?: string;
    content?: string;
    conversationId?: string;
    message?: string;
  };
}
