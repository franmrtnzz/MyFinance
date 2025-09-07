export interface Transaction {
  id?: number;
  date: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category?: string;
  createdAt: Date;
}

export interface Investment {
  id?: number;
  category: 'individuales' | 'fondos_indexados' | 'criptoactivos' | 'materias_primas';
  asset: string;
  quantity: number;
  broker: string;
  currentPrice?: number;
  lastUpdated?: Date;
}

export interface RecurringPayment {
  id?: number;
  concept: string;
  monthlyAmount: number;
  issueDate: string;
  dueDate?: string;
  isActive: boolean;
}

export interface PendingTask {
  id?: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  completedAt?: Date;
}

export interface MonthlySummary {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

export interface QuickTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
}
