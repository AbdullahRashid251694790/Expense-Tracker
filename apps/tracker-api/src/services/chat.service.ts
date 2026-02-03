/**
 * Chat Service
 * OpenRouter integration for streaming chat responses
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You are Casha AI, a helpful financial assistant for the Casha expense tracking app.

IMPORTANT DOMAIN RESTRICTIONS:
- You ONLY discuss topics related to: personal finance, budgeting, expense tracking, saving money, investments, financial planning, debt management, and general money management.
- If a user asks about ANY topic outside of finance/expenses, politely decline and redirect them to finance-related questions.
- Example responses for off-topic questions:
  - "I'm Casha AI, specialized in helping with your finances. I can help you with budgeting, tracking expenses, or saving tips. What financial topic can I assist you with?"
  - "That's outside my area of expertise. I'm here to help with money matters - would you like tips on budgeting or managing expenses instead?"

RESPONSE GUIDELINES:
- Be concise, friendly, and actionable
- Use markdown formatting for clarity (headers, bullet points, bold text)
- When discussing money amounts, use the user's preferred currency symbol (provided in context). If no currency is specified, default to $
- Provide specific, practical advice when possible
- If you need more context about their expenses or budget, ask clarifying questions

CONTEXT AWARENESS:
- Users are tracking their expenses with Casha
- They may ask about their spending patterns, budget recommendations, or general financial advice
- Help them understand and improve their financial habits`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface UserContext {
  totalSpent?: number;
  totalBudget?: number;
  remaining?: number;
  topCategories?: Array<{ name: string; amount: number; percentage: number }>;
  recentExpenses?: Array<{ description: string; amount: number; category: string; date: string }>;
  spendingTrend?: 'up' | 'down' | 'stable';
  currency?: string;
  currencySymbol?: string;
}

export class ChatService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Build context-aware system prompt
   */
  private buildSystemPrompt(context?: UserContext): string {
    if (!context || Object.keys(context).length === 0) {
      return SYSTEM_PROMPT;
    }

    // Use user's currency symbol or default to $
    const currencySymbol = context.currencySymbol || '$';
    const currencyCode = context.currency || 'USD';

    let contextInfo = '\n\nUSER\'S CURRENT FINANCIAL DATA:\n';
    contextInfo += `- User's preferred currency: ${currencyCode} (${currencySymbol})\n`;
    contextInfo += `IMPORTANT: Always display all monetary values using the ${currencySymbol} symbol (${currencyCode}). Never use $ or any other currency symbol.\n\n`;

    if (context.totalSpent !== undefined && context.totalBudget !== undefined) {
      contextInfo += `- Total spent this month: ${currencySymbol}${context.totalSpent.toFixed(2)}\n`;
      contextInfo += `- Monthly budget: ${currencySymbol}${context.totalBudget.toFixed(2)}\n`;
      if (context.remaining !== undefined) {
        contextInfo += `- Remaining budget: ${currencySymbol}${context.remaining.toFixed(2)}\n`;
      }
    }

    if (context.spendingTrend) {
      contextInfo += `- Spending trend: ${context.spendingTrend}\n`;
    }

    if (context.topCategories && context.topCategories.length > 0) {
      contextInfo += '\nTop spending categories:\n';
      context.topCategories.slice(0, 5).forEach((cat) => {
        contextInfo += `  - ${cat.name}: ${currencySymbol}${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)\n`;
      });
    }

    if (context.recentExpenses && context.recentExpenses.length > 0) {
      contextInfo += '\nRecent expenses:\n';
      context.recentExpenses.slice(0, 5).forEach((exp) => {
        contextInfo += `  - ${exp.description}: ${currencySymbol}${exp.amount.toFixed(2)} (${exp.category}) on ${exp.date}\n`;
      });
    }

    contextInfo += `\nUse this data to provide personalized financial advice when relevant to the user's question. Remember to always use ${currencySymbol} (${currencyCode}) for all monetary values.`;

    return SYSTEM_PROMPT + contextInfo;
  }

  /**
   * Stream chat completion using OpenRouter
   * Yields chunks of the response as they arrive
   */
  async *streamChatCompletion(
    messages: ChatMessage[],
    context?: UserContext
  ): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      // Fallback for non-configured API
      yield "I'm sorry, the AI service is not configured. Please set up your OpenRouter API key.";
      return;
    }

    const systemPrompt = this.buildSystemPrompt(context);
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
        'X-Title': 'Casha Expense Tracker',
      },
      body: JSON.stringify({
        model: this.model,
        messages: fullMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status}`, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  /**
   * Non-streaming chat completion (fallback)
   */
  async getChatCompletion(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) {
      return "I'm sorry, the AI service is not configured.";
    }

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
        'X-Title': 'Casha Expense Tracker',
      },
      body: JSON.stringify({
        model: this.model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

export const chatService = new ChatService();
