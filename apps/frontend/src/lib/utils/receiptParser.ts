/**
 * Receipt Parser Utility
 * Extracts expense data from OCR text
 */

export interface ParsedReceipt {
  amount: number | null;
  description: string | null;
  date: string | null;
  merchant: string | null;
  confidence: number;
}

/**
 * Extract total amount from receipt text
 * Looks for common patterns like "Total", "Grand Total", "Amount Due"
 */
function extractAmount(text: string): number | null {
  const lines = text.split('\n');

  // Patterns to look for total amount
  const totalPatterns = [
    /total[:\s]*\$?(\d+[.,]\d{2})/i,
    /grand\s*total[:\s]*\$?(\d+[.,]\d{2})/i,
    /amount\s*due[:\s]*\$?(\d+[.,]\d{2})/i,
    /subtotal[:\s]*\$?(\d+[.,]\d{2})/i,
    /balance[:\s]*\$?(\d+[.,]\d{2})/i,
    /\$(\d+[.,]\d{2})/g, // Generic dollar amount
  ];

  // First try to find explicit total
  for (const line of lines) {
    for (const pattern of totalPatterns.slice(0, 5)) {
      const match = line.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(',', '.'));
      }
    }
  }

  // If no explicit total found, find the largest dollar amount
  const allAmounts: number[] = [];
  const amountRegex = /\$?(\d+[.,]\d{2})/g;
  let match;
  while ((match = amountRegex.exec(text)) !== null) {
    const amount = parseFloat(match[1].replace(',', '.'));
    if (amount > 0 && amount < 10000) { // Reasonable receipt amount range
      allAmounts.push(amount);
    }
  }

  if (allAmounts.length > 0) {
    // Return the largest amount as it's likely the total
    return Math.max(...allAmounts);
  }

  return null;
}

/**
 * Extract date from receipt text
 */
function extractDate(text: string): string | null {
  // Common date patterns
  const datePatterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,  // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,    // YYYY/MM/DD
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2}),?\s*(\d{4})/i, // Month DD, YYYY
    /(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})/i,   // DD Month YYYY
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        // Try to parse and format as YYYY-MM-DD
        const dateStr = match[0];
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }
      } catch {
        // Continue to next pattern
      }
    }
  }

  // Default to today
  return new Date().toISOString().split('T')[0];
}

/**
 * Extract merchant/store name from receipt
 * Usually at the top of the receipt
 */
function extractMerchant(text: string): string | null {
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  if (lines.length === 0) return null;

  // First few non-empty lines often contain merchant name
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    // Skip lines that look like addresses, phone numbers, or dates
    if (
      line.length > 3 &&
      line.length < 50 &&
      !/^\d+\s/.test(line) && // Doesn't start with numbers (address)
      !/\d{3}[.-]?\d{3}[.-]?\d{4}/.test(line) && // Not a phone number
      !/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(line) // Not a date
    ) {
      return line;
    }
  }

  return null;
}

/**
 * Calculate confidence score based on extracted data
 */
function calculateConfidence(result: Partial<ParsedReceipt>): number {
  let score = 0;

  if (result.amount !== null) score += 40;
  if (result.date !== null) score += 20;
  if (result.merchant !== null) score += 20;
  if (result.description !== null) score += 20;

  return score;
}

/**
 * Parse OCR text and extract receipt data
 */
export function parseReceiptText(text: string): ParsedReceipt {
  const amount = extractAmount(text);
  const date = extractDate(text);
  const merchant = extractMerchant(text);

  // Use merchant as description if found
  const description = merchant;

  const result: ParsedReceipt = {
    amount,
    description,
    date,
    merchant,
    confidence: 0,
  };

  result.confidence = calculateConfidence(result);

  return result;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
