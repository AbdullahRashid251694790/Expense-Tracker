/**
 * Recommendations Service
 * OpenRouter integration for daily personalized recommendations
 */

import type { AIInsight, DailyRecommendation } from '@casha/shared';

interface SpendingContext {
  totalSpent: number;
  totalBudget: number;
  remaining: number;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
  recentExpenses: Array<{ description: string; amount: number; category: string; date: string }>;
  spendingTrend: 'up' | 'down' | 'stable';
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

const DAILY_RECOMMENDATIONS_PROMPT = `You are Casha AI, a helpful financial assistant. Generate 3-4 personalized daily recommendations based on the user's spending data.

RECOMMENDATION TYPES (use a mix):
- spending_analysis: Analyze current spending patterns
- recommendation: Actionable advice to improve finances
- pattern_detection: Identify spending patterns or habits
- savings_tip: Specific tips to save money

SEVERITY LEVELS:
- success: Positive reinforcement, good habits
- info: Neutral advice or information
- warning: Areas needing attention

RESPONSE FORMAT (JSON only, no markdown):
{"recommendations": [{"type": "spending_analysis", "title": "string", "message": "string", "severity": "info"}, ...]}

GUIDELINES:
- Be specific and actionable
- Reference the user's actual spending data
- Keep messages concise (1-2 sentences)
- Mix positive and constructive feedback
- Focus on daily/actionable items`;

export class RecommendationsService {
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
   * Generate daily recommendations based on spending context
   */
  async generateDailyRecommendations(
    userId: string,
    context: SpendingContext
  ): Promise<Omit<DailyRecommendation, 'id'>> {
    const today = new Date().toISOString().split('T')[0];
    const recommendations = await this.getRecommendations(context);

    return {
      userId,
      date: today,
      recommendations,
      context: {
        totalSpent: context.totalSpent,
        totalBudget: context.totalBudget,
        topCategories: context.topCategories.slice(0, 3).map((c) => c.name),
        spendingTrend: context.spendingTrend,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get AI-generated recommendations
   */
  private async getRecommendations(context: SpendingContext): Promise<AIInsight[]> {
    if (!this.apiKey) {
      console.warn('OPENROUTER_API_KEY not configured, returning mock recommendations');
      return this.getMockRecommendations(context);
    }

    const prompt = this.buildPrompt(context);

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
            { role: 'system', content: DAILY_RECOMMENDATIONS_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API error: ${response.status}`, errorText);
        throw new Error(`AI service error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in AI response');
      }

      // Parse JSON response - strip markdown code blocks if present
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const parsed = JSON.parse(jsonContent);

      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error('Invalid AI response format');
      }

      return parsed.recommendations.map(
        (rec: { type: string; title: string; message: string; severity: string }, index: number) => ({
          id: `daily-${Date.now()}-${index}`,
          type: this.validateInsightType(rec.type),
          title: rec.title || 'Daily Tip',
          message: rec.message || '',
          severity: this.validateSeverity(rec.severity),
          createdAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Recommendations service error:', error);
      return this.getMockRecommendations(context);
    }
  }

  /**
   * Build prompt with spending context
   */
  private buildPrompt(context: SpendingContext): string {
    const symbol = context.currencySymbol || '$';
    const currency = context.currency || 'USD';

    const parts: string[] = [
      `Here's my current spending situation (currency: ${currency}, use ${symbol} for all amounts):`,
    ];

    if (context.totalBudget > 0) {
      const percentUsed = ((context.totalSpent / context.totalBudget) * 100).toFixed(0);
      parts.push(`- Total spent this month: ${symbol}${context.totalSpent.toFixed(2)}`);
      parts.push(`- Monthly budget: ${symbol}${context.totalBudget.toFixed(2)} (${percentUsed}% used)`);
      parts.push(`- Remaining: ${symbol}${context.remaining.toFixed(2)}`);
    } else {
      parts.push(`- Total spent this month: ${symbol}${context.totalSpent.toFixed(2)}`);
      parts.push(`- No budget set yet`);
    }

    if (context.topCategories.length > 0) {
      parts.push('\nTop spending categories:');
      context.topCategories.slice(0, 5).forEach((cat) => {
        parts.push(`- ${cat.name}: ${symbol}${cat.amount.toFixed(2)} (${cat.percentage.toFixed(0)}%)`);
      });
    }

    if (context.recentExpenses.length > 0) {
      parts.push('\nRecent expenses:');
      context.recentExpenses.slice(0, 5).forEach((exp) => {
        parts.push(`- ${exp.description || 'Expense'}: ${symbol}${exp.amount.toFixed(2)} (${exp.category}) on ${exp.date}`);
      });
    }

    const trendSign = context.changePercentage > 0 ? '+' : '';
    parts.push(`\nSpending trend: ${context.spendingTrend} (${trendSign}${context.changePercentage.toFixed(0)}% vs last month)`);

    parts.push(`\nGenerate 3-4 personalized daily recommendations for me. Use ${symbol} for all monetary values.`);

    return parts.join('\n');
  }

  private validateInsightType(
    type: string
  ): 'spending_analysis' | 'recommendation' | 'pattern_detection' | 'savings_tip' {
    const validTypes = ['spending_analysis', 'recommendation', 'pattern_detection', 'savings_tip'];
    return validTypes.includes(type) ? (type as any) : 'recommendation';
  }

  private validateSeverity(severity: string): 'info' | 'warning' | 'success' {
    const validSeverities = ['info', 'warning', 'success'];
    return validSeverities.includes(severity) ? (severity as any) : 'info';
  }

  /**
   * Generate mock recommendations when API is not available
   */
  private getMockRecommendations(context: SpendingContext): AIInsight[] {
    const now = Date.now();
    const recommendations: AIInsight[] = [];

    // Budget-based recommendation
    if (context.totalBudget > 0) {
      const percentUsed = (context.totalSpent / context.totalBudget) * 100;

      if (percentUsed >= 80) {
        recommendations.push({
          id: `daily-${now}-1`,
          type: 'spending_analysis',
          title: 'Budget Alert',
          message: `You've used ${percentUsed.toFixed(0)}% of your budget. Consider postponing non-essential purchases until next month.`,
          severity: 'warning',
          createdAt: new Date().toISOString(),
        });
      } else if (percentUsed < 50) {
        recommendations.push({
          id: `daily-${now}-1`,
          type: 'savings_tip',
          title: 'Great Progress',
          message: `Only ${percentUsed.toFixed(0)}% of budget used! Consider moving some savings to an emergency fund.`,
          severity: 'success',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Top category recommendation
    if (context.topCategories.length > 0) {
      const topCat = context.topCategories[0];
      if (topCat.percentage > 30) {
        recommendations.push({
          id: `daily-${now}-2`,
          type: 'pattern_detection',
          title: `High ${topCat.name} Spending`,
          message: `${topCat.name} makes up ${topCat.percentage.toFixed(0)}% of your spending. Look for ways to reduce costs in this category.`,
          severity: 'info',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Trend-based recommendation
    if (context.spendingTrend === 'up' && context.changePercentage > 10) {
      recommendations.push({
        id: `daily-${now}-3`,
        type: 'recommendation',
        title: 'Spending Increase',
        message: `Your spending is up ${context.changePercentage.toFixed(0)}% this month. Try a no-spend day today to balance things out.`,
        severity: 'warning',
        createdAt: new Date().toISOString(),
      });
    } else if (context.spendingTrend === 'down') {
      recommendations.push({
        id: `daily-${now}-3`,
        type: 'savings_tip',
        title: 'Keep It Up!',
        message: `Your spending is down ${Math.abs(context.changePercentage).toFixed(0)}% - great job! Maintain this momentum.`,
        severity: 'success',
        createdAt: new Date().toISOString(),
      });
    }

    // Always add a general daily tip
    recommendations.push({
      id: `daily-${now}-4`,
      type: 'recommendation',
      title: 'Daily Tip',
      message: 'Review your expenses at the end of each day to stay aware of your spending habits.',
      severity: 'info',
      createdAt: new Date().toISOString(),
    });

    return recommendations.slice(0, 4);
  }
}

export const recommendationsService = new RecommendationsService();
