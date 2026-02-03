/**
 * Chat Service (Drizzle ORM)
 * CRUD operations for chat conversations and messages using PostgreSQL
 */

import { eq, and, desc, asc } from 'drizzle-orm';
import { db, schema } from '../../db';
import type { ChatConversation, ChatMessage } from '@casha/shared';

/**
 * Convert database conversation to API response format
 */
function toConversationResponse(
  conversation: typeof schema.chatConversations.$inferSelect
): ChatConversation {
  return {
    id: conversation.id,
    userId: conversation.userId,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

/**
 * Convert database message to API response format
 */
function toMessageResponse(message: typeof schema.chatMessages.$inferSelect): ChatMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}

/**
 * Get all conversations for a user
 */
export async function getConversations(userId: string): Promise<ChatConversation[]> {
  const conversations = await db
    .select()
    .from(schema.chatConversations)
    .where(eq(schema.chatConversations.userId, userId))
    .orderBy(desc(schema.chatConversations.updatedAt));

  return conversations.map(toConversationResponse);
}

/**
 * Get a single conversation with all its messages
 */
export async function getConversation(
  userId: string,
  conversationId: string
): Promise<{ conversation: ChatConversation; messages: ChatMessage[] } | null> {
  const conversation = await db.query.chatConversations.findFirst({
    where: and(
      eq(schema.chatConversations.id, conversationId),
      eq(schema.chatConversations.userId, userId)
    ),
  });

  if (!conversation) return null;

  const messages = await db
    .select()
    .from(schema.chatMessages)
    .where(eq(schema.chatMessages.conversationId, conversationId))
    .orderBy(asc(schema.chatMessages.createdAt));

  return {
    conversation: toConversationResponse(conversation),
    messages: messages.map(toMessageResponse),
  };
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  userId: string,
  conversationId: string
): Promise<ChatMessage[]> {
  // Verify conversation belongs to user
  const conversation = await db.query.chatConversations.findFirst({
    where: and(
      eq(schema.chatConversations.id, conversationId),
      eq(schema.chatConversations.userId, userId)
    ),
  });

  if (!conversation) return [];

  const messages = await db
    .select()
    .from(schema.chatMessages)
    .where(eq(schema.chatMessages.conversationId, conversationId))
    .orderBy(asc(schema.chatMessages.createdAt));

  return messages.map(toMessageResponse);
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  title: string = 'New Conversation'
): Promise<ChatConversation> {
  const [conversation] = await db
    .insert(schema.chatConversations)
    .values({
      userId,
      title,
    })
    .returning();

  return toConversationResponse(conversation);
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<ChatMessage> {
  // Use a transaction to add message and update conversation
  const result = await db.transaction(async (tx) => {
    // Verify conversation belongs to user
    const conversation = await tx.query.chatConversations.findFirst({
      where: and(
        eq(schema.chatConversations.id, conversationId),
        eq(schema.chatConversations.userId, userId)
      ),
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Add message
    const [message] = await tx
      .insert(schema.chatMessages)
      .values({
        conversationId,
        role,
        content,
      })
      .returning();

    // Update conversation's updatedAt
    await tx
      .update(schema.chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(schema.chatConversations.id, conversationId));

    return message;
  });

  return toMessageResponse(result);
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  userId: string,
  conversationId: string,
  title: string
): Promise<void> {
  await db
    .update(schema.chatConversations)
    .set({ title, updatedAt: new Date() })
    .where(
      and(
        eq(schema.chatConversations.id, conversationId),
        eq(schema.chatConversations.userId, userId)
      )
    );
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  // Messages will be automatically deleted due to CASCADE
  await db
    .delete(schema.chatConversations)
    .where(
      and(
        eq(schema.chatConversations.id, conversationId),
        eq(schema.chatConversations.userId, userId)
      )
    );
}
