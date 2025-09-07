import Dexie, { type Table } from 'dexie';

export interface Transaction {
  id?: number;
  date: string; // YYYY-MM-DD format
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

export interface Note {
  id?: number;
  title: string;
  content: string;
  reminderDate?: string; // YYYY-MM-DD
  createdAt: Date;
  updatedAt?: Date;
}

export type PortfolioCategory =
  | 'inmueble'
  | 'vehiculo'
  | 'efectivo'
  | 'deposito'
  | 'accion'
  | 'etf'
  | 'bono'
  | 'fondo'
  | 'cripto'
  | 'materia_prima'
  | 'divisa'
  | 'otros';

export interface PortfolioTx {
  id?: number;
  date: string; // YYYY-MM-DD
  asset: string; // human name
  symbol?: string; // ticker or fx pair or coingecko id
  category: PortfolioCategory;
  price: number; // purchase price in EUR by default
  quantity: number;
  notes?: string;
  createdAt: Date;
}

export interface PriceCache {
  id?: number;
  symbol: string; // symbol or coingecko id
  source: 'alpha_vantage' | 'coingecko';
  currency: string; // e.g., EUR
  price: number;
  updatedAt: Date;
}

export interface Loan {
  id?: number;
  borrower: string; // amigo/empresa
  principal: number; // importe prestado en EUR
  annualRate: number; // % anual, ej. 5 => 5%
  startDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: Date;
}

export interface LoanPayment {
  id?: number;
  loanId: number;
  date: string; // YYYY-MM-DD
  amount: number; // abono recibido (capital+interés)
}

export interface MonthlySnapshot {
  id?: number;
  year: number;
  month: number; // 1-12
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  closedAt: Date;
}

export class FinanzasDB extends Dexie {
  transactions!: Table<Transaction>;
  investments!: Table<Investment>;
  recurringPayments!: Table<RecurringPayment>;
  pendingTasks!: Table<PendingTask>;
  notes!: Table<Note>;
  portfolioTx!: Table<PortfolioTx>;
  prices!: Table<PriceCache>;
  loans!: Table<Loan>;
  loanPayments!: Table<LoanPayment>;
  monthlySnapshots!: Table<MonthlySnapshot>;

  constructor() {
    super('FinanzasDB');
    this.version(1).stores({
      transactions: '++id, date, type, amount, category, createdAt',
      investments: '++id, category, asset, broker',
      recurringPayments: '++id, concept, monthlyAmount, isActive',
      pendingTasks: '++id, description, priority, createdAt, completedAt',
    });
    // Version 2: add notes
    this.version(2).stores({
      notes: '++id, title, reminderDate, createdAt, updatedAt',
    });
    // Version 3: portfolio and price cache
    this.version(3).stores({
      portfolioTx: '++id, date, category, symbol, asset, createdAt',
      prices: '++id, symbol, source, currency, updatedAt',
    });
    // Version 4: loans
    this.version(4).stores({
      loans: '++id, borrower, startDate, createdAt',
      loanPayments: '++id, loanId, date',
    });
    // Version 5: monthly snapshots
    this.version(5).stores({
      monthlySnapshots: '++id, year, month',
    });
  }
}

export const db = new FinanzasDB();
