/**
 * AI Service
 * OpenRouter integration for spending insights
 */

import type { AIInsight, AIAdviceRequest } from '@casha/shared';

interface SpendingData {
  totalSpent: number;
  totalBudget: number;
  categorySpending: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  currency?: string;
  currencySymbol?: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class AIService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';
  }

  /**
   * Check if AI service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Generate AI-powered spending insights
   */
  async generateInsights(
    spendingData: SpendingData,
    options: AIAdviceRequest
  ): Promise<AIInsight[]> {
    if (!this.apiKey) {
      console.warn('OPENROUTER_API_KEY not configured, returning mock insights');
      return this.getMockInsights(spendingData);
    }

    const prompt = this.buildPrompt(spendingData, options);

    try {
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
          messages: [
            {
              role: 'system',
              content: `You are a helpful financial advisor AI for the Casha expense tracking app.
Analyze spending patterns and provide actionable, personalized advice.
Be concise but helpful. Focus on practical tips.
Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{"insights": [{"type": "spending_analysis", "title": "string", "message": "string", "severity": "info"}, ...]}

Types must be one of: "spending_analysis", "recommendation", "pattern_detection", "savings_tip"
Severity must be one of: "info", "warning", "success"
Provide 2-4 insights based on the data.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API error: ${response.status}`, errorText);
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in AI response');
      }

      // Parse the JSON response - strip markdown code blocks if present
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const parsed = JSON.parse(jsonContent);

      if (!parsed.insights || !Array.isArray(parsed.insights)) {
        throw new Error('Invalid AI response format');
      }

      return parsed.insights.map(
        (insight: { type: string; title: string; message: string; severity: string }, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          type: this.validateInsightType(insight.type),
          title: insight.title || 'Spending Insight',
          message: insight.message || '',
          severity: this.validateSeverity(insight.severity),
          createdAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('AI service error:', error);
      // Fallback to mock insights on error
      return this.getMockInsights(spendingData);
    }
  }

  /**
   * Build the prompt for the AI
   */
  private buildPrompt(data: SpendingData, options: AIAdviceRequest): string {
    const symbol = data.currencySymbol || '$';
    const currency = data.currency || 'USD';

    const parts: string[] = [
      `Analyze my ${options.period}ly spending (currency: ${currency}, use ${symbol} for all amounts):`,
      `- Total spent: ${symbol}${data.totalSpent.toFixed(2)}`,
    ];

    if (data.totalBudget > 0) {
      const percentUsed = ((data.totalSpent / data.totalBudget) * 100).toFixed(0);
      parts.push(`- Budget: ${symbol}${data.totalBudget.toFixed(2)} (${percentUsed}% used)`);

      if (data.totalSpent > data.totalBudget) {
        parts.push(`- OVER BUDGET by ${symbol}${(data.totalSpent - data.totalBudget).toFixed(2)}`);
      } else {
        parts.push(`- Remaining: ${symbol}${(data.totalBudget - data.totalSpent).toFixed(2)}`);
      }
    }

    if (options.includeCategories && data.categorySpending.length > 0) {
      parts.push('\nTop spending categories:');
      data.categorySpending.slice(0, 5).forEach((cat) => {
        parts.push(`- ${cat.name}: ${symbol}${cat.amount.toFixed(2)} (${cat.percentage.toFixed(0)}%)`);
      });
    }

    if (options.includeTrends) {
      const sign = data.changePercentage > 0 ? '+' : '';
      parts.push(
        `\nSpending trend: ${data.trend} (${sign}${data.changePercentage.toFixed(0)}% vs last ${options.period})`
      );
    }

    parts.push(`\nProvide 2-4 specific, actionable insights based on this data. Use ${symbol} for all monetary values.`);

    return parts.join('\n');
  }

  /**
   * Validate insight type
   */
  private validateInsightType(
    type: string
  ): 'spending_analysis' | 'recommendation' | 'pattern_detection' | 'savings_tip' {
    const validTypes = ['spending_analysis', 'recommendation', 'pattern_detection', 'savings_tip'];
    return validTypes.includes(type) ? (type as any) : 'spending_analysis';
  }

  /**
   * Validate severity level
   */
  private validateSeverity(severity: string): 'info' | 'warning' | 'success' {
    const validSeverities = ['info', 'warning', 'success'];
    return validSeverities.includes(severity) ? (severity as any) : 'info';
  }

  /**
   * Generate mock insights based on spending data
   */
  private getMockInsights(data: SpendingData): AIInsight[] {
    const insights: AIInsight[] = [];
    const now = Date.now();
    const symbol = data.currencySymbol || '$';

    // Budget status insight
    if (data.totalBudget > 0) {
      const percentUsed = (data.totalSpent / data.totalBudget) * 100;

      if (percentUsed >= 100) {
        insights.push({
          id: `mock-${now}-1`,
          type: 'spending_analysis',
          title: 'Budget Exceeded',
          message: `You've exceeded your budget by ${symbol}${(data.totalSpent - data.totalBudget).toFixed(2)}. Consider reviewing your expenses and identifying areas to cut back.`,
          severity: 'warning',
          createdAt: new Date().toISOString(),
        });
      } else if (percentUsed >= 80) {
        insights.push({
          id: `mock-${now}-1`,
          type: 'spending_analysis',
          title: 'Approaching Budget Limit',
          message: `You've used ${percentUsed.toFixed(0)}% of your budget. You have ${symbol}${(data.totalBudget - data.totalSpent).toFixed(2)} remaining.`,
          severity: 'warning',
          createdAt: new Date().toISOString(),
        });
      } else {
        insights.push({
          id: `mock-${now}-1`,
          type: 'spending_analysis',
          title: 'On Track',
          message: `Good job! You've used ${percentUsed.toFixed(0)}% of your budget with ${symbol}${(data.totalBudget - data.totalSpent).toFixed(2)} remaining.`,
          severity: 'success',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Trend insight
    if (data.trend === 'up' && data.changePercentage > 10) {
      insights.push({
        id: `mock-${now}-2`,
        type: 'pattern_detection',
        title: 'Spending Increase Detected',
        message: `Your spending is up ${data.changePercentage.toFixed(0)}% compared to last period. Review recent expenses to understand the increase.`,
        severity: 'warning',
        createdAt: new Date().toISOString(),
      });
    } else if (data.trend === 'down') {
      insights.push({
        id: `mock-${now}-2`,
        type: 'savings_tip',
        title: 'Spending Decreased',
        message: `Great work! Your spending is down ${Math.abs(data.changePercentage).toFixed(0)}% compared to last period. Keep it up!`,
        severity: 'success',
        createdAt: new Date().toISOString(),
      });
    }

    // Top category insight
    if (data.categorySpending.length > 0) {
      const topCategory = data.categorySpending[0];
      if (topCategory.percentage > 40) {
        insights.push({
          id: `mock-${now}-3`,
          type: 'recommendation',
          title: `High ${topCategory.name} Spending`,
          message: `${topCategory.name} accounts for ${topCategory.percentage.toFixed(0)}% of your spending. Consider setting a specific budget for this category.`,
          severity: 'info',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Always add a general tip if we have fewer than 2 insights
    if (insights.length < 2) {
      insights.push({
        id: `mock-${now}-4`,
        type: 'recommendation',
        title: 'Track Consistently',
        message: 'Recording expenses regularly helps you stay aware of spending patterns and make better financial decisions.',
        severity: 'info',
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }
}

// Export singleton instance
export const aiService = new AIService();
