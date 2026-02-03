/**
 * Income Types
 * Income source type definitions
 */

export type IncomeFrequency = 'monthly' | 'yearly' | 'one-time';

export interface IncomeSource {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  createdAt: string;
}

export interface CreateIncomeSourceRequest {
  name: string;
  amount: number;
  frequency: IncomeFrequency;
}

export interface UpdateIncomeSourceRequest {
  name?: string;
  amount?: number;
  frequency?: IncomeFrequency;
}
