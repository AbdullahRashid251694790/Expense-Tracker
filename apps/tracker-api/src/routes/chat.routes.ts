/**
 * Chat Routes
 * CRUD operations for conversations and messages + SSE streaming
 */

import { Router } from 'express';
import { jwtAuthMiddleware, type JwtAuthRequest } from '../middleware/jwt-auth.middleware';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  sendMessageSchema,
  createConversationSchema,
  updateConversationSchema,
  addMessageSchema,
  idParamSchema,
} from '../validation/schemas';
import { chatService, type ChatMessage, type UserContext } from '../services/chat.service';
import * as chatDrizzleService from '../services/drizzle/chat.service';
import { Errors } from '../utils/errors';

const router = Router();

// All routes require JWT authentication
router.use(jwtAuthMiddleware);

// GET /api/chat/conversations - List all conversations
router.get('/conversations', async (req: JwtAuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const conversations = await chatDrizzleService.getConversations(userId);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/conversations/:id - Get single conversation with messages
router.get(
  '/conversations/:id',
  validateParams(idParamSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const result = await chatDrizzleService.getConversation(userId, id);
      if (!result) {
        throw Errors.notFound('Conversation');
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/chat/conversations - Create new conversation
router.post(
  '/conversations',
  validateBody(createConversationSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { title } = req.body as { title?: string };

      const conversation = await chatDrizzleService.createConversation(userId, title);
      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/chat/conversations/:id - Update conversation title
router.put(
  '/conversations/:id',
  validateParams(idParamSchema),
  validateBody(updateConversationSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { title } = req.body as { title: string };

      // Check if conversation exists
      const existing = await chatDrizzleService.getConversation(userId, id);
      if (!existing) {
        throw Errors.notFound('Conversation');
      }

      await chatDrizzleService.updateConversationTitle(userId, id, title);

      // Return updated conversation
      const updated = await chatDrizzleService.getConversation(userId, id);
      res.json(updated?.conversation);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/chat/conversations/:id - Delete conversation
router.delete(
  '/conversations/:id',
  validateParams(idParamSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      // Check if conversation exists
      const existing = await chatDrizzleService.getConversation(userId, id);
      if (!existing) {
        throw Errors.notFound('Conversation');
      }

      await chatDrizzleService.deleteConversation(userId, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/chat/conversations/:id/messages - Add message to conversation
router.post(
  '/conversations/:id/messages',
  validateParams(idParamSchema),
  validateBody(addMessageSchema),
  async (req: JwtAuthRequest, res, next) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { role, content } = req.body as { role: 'user' | 'assistant'; content: string };

      // Check if conversation exists
      const existing = await chatDrizzleService.getConversation(userId, id);
      if (!existing) {
        throw Errors.notFound('Conversation');
      }

      const message = await chatDrizzleService.addMessage(userId, id, role, content);
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/chat/stream - Send message and stream response
// Client sends conversation history, server streams AI response
router.post(
  '/stream',
  validateBody(sendMessageSchema),
  async (req: JwtAuthRequest, res) => {
    try {
      const { message, history, context } = req.body as {
        message: string;
        conversationId?: string;
        history?: Array<{ role: 'user' | 'assistant'; content: string }>;
        context?: UserContext;
      };

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Build messages for AI
      const messagesForAI: ChatMessage[] = [
        ...(history || []).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content: message },
      ];

      // Stream AI response with user context
      let fullResponse = '';

      try {
        for await (const chunk of chatService.streamChatCompletion(messagesForAI, context)) {
          fullResponse += chunk;
          res.write(`event: message\ndata: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      } catch (aiError) {
        console.error('AI streaming error:', aiError);
        fullResponse = "I'm sorry, I encountered an error processing your request. Please try again.";
        res.write(`event: message\ndata: ${JSON.stringify({ content: fullResponse })}\n\n`);
      }

      // Send done event with full response (client saves to database)
      res.write(`event: done\ndata: ${JSON.stringify({ fullResponse })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Chat stream error:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'An error occurred' })}\n\n`);
      res.end();
    }
  }
);

export default router;
