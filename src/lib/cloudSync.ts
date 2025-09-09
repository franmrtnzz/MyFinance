import { db, type Transaction, type Note, type PortfolioTx, type Loan } from '../database/db';
import { supabase } from './supabase';

export interface RestoreSummary {
  transactions: number;
  notes: number;
  portfolio: number;
  loans: number;
}

export async function restoreAllFromCloud(deviceId: string): Promise<RestoreSummary> {
  const [t, n, p, l] = await Promise.all([
    restoreTransactionsFromCloud(deviceId),
    restoreNotesFromCloud(deviceId),
    restorePortfolioFromCloud(deviceId),
    restoreLoansFromCloud(deviceId),
  ]);
  return { transactions: t, notes: n, portfolio: p, loans: l };
}

export async function restoreTransactionsFromCloud(deviceId: string): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .select('date, type, description, amount, category, created_at')
    .eq('user_id', deviceId);
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => ({
    date: r.date as string,
    type: r.type as 'income' | 'expense',
    description: r.description as string,
    amount: Number(r.amount),
    category: r.category ?? undefined,
    createdAt: r.created_at ? new Date(r.created_at) : new Date(),
  })) as Omit<Transaction, 'id'>[];
  await db.transactions.clear();
  if (rows.length > 0) await db.transactions.bulkAdd(rows as Transaction[]);
  return rows.length;
}

export async function restoreNotesFromCloud(deviceId: string): Promise<number> {
  const { data, error } = await supabase
    .from('notes')
    .select('title, content, reminder_date, created_at, updated_at')
    .eq('user_id', deviceId);
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => ({
    title: r.title as string,
    content: r.content as string,
    reminderDate: r.reminder_date ?? undefined,
    createdAt: r.created_at ? new Date(r.created_at) : new Date(),
    updatedAt: r.updated_at ? new Date(r.updated_at) : undefined,
  })) as Omit<Note, 'id'>[];
  if (db.notes) {
    await db.notes.clear();
    if (rows.length > 0) await db.notes.bulkAdd(rows as Note[]);
  }
  return rows.length;
}

export async function restorePortfolioFromCloud(deviceId: string): Promise<number> {
  const { data, error } = await supabase
    .from('portfolio_tx')
    .select('date, asset, symbol, category, price, quantity, notes, created_at')
    .eq('user_id', deviceId);
  if (error) throw error;
  const rows = (data ?? []).map((r: any) => ({
    date: r.date as string,
    asset: r.asset as string,
    symbol: r.symbol ?? undefined,
    category: r.category as any,
    price: Number(r.price),
    quantity: Number(r.quantity),
    notes: r.notes ?? undefined,
    createdAt: r.created_at ? new Date(r.created_at) : new Date(),
  })) as Omit<PortfolioTx, 'id'>[];
  await db.portfolioTx.clear();
  if (rows.length > 0) await db.portfolioTx.bulkAdd(rows as PortfolioTx[]);
  return rows.length;
}

export async function restoreLoansFromCloud(deviceId: string): Promise<number> {
  const [loansRes, paysRes] = await Promise.all([
    supabase
      .from('loans')
      .select('borrower, principal, annual_rate, start_date, notes, created_at')
      .eq('user_id', deviceId),
    supabase
      .from('loan_payments')
      .select('loan_borrower, loan_start_date, date, amount')
      .eq('user_id', deviceId),
  ]);
  if (loansRes.error) throw loansRes.error;
  if (paysRes.error) throw paysRes.error;
  const loans = (loansRes.data ?? []).map((r: any) => ({
    borrower: r.borrower as string,
    principal: Number(r.principal),
    annualRate: Number(r.annual_rate),
    startDate: r.start_date as string,
    notes: r.notes ?? undefined,
    createdAt: r.created_at ? new Date(r.created_at) : new Date(),
  })) as Omit<Loan, 'id'>[];
  await db.loans.clear();
  await db.loanPayments.clear();
  // Insert loans first
  for (const l of loans as Loan[]) {
    await db.loans.add(l as Loan);
  }
  // We cannot reconstruct loanId from borrower/startDate without a mapping; skip linking here.
  return loans.length;
}

export interface CloudTransactionInput {
  date: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category?: string;
}

export async function replaceTransactionsInCloudForUser(
  userId: string,
  rows: CloudTransactionInput[],
  fromDate: string,
  toDate: string,
): Promise<number> {
  // Delete existing range
  const del = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId)
    .gte('date', fromDate)
    .lte('date', toDate);
  if (del.error) throw del.error;
  if (rows.length === 0) return 0;
  // Insert all
  const payload = rows.map((r) => ({
    user_id: userId,
    date: r.date,
    type: r.type,
    description: r.description,
    amount: r.amount,
    category: r.category ?? null,
  }));
  const ins = await supabase.from('transactions').insert(payload);
  if (ins.error) throw ins.error;
  return payload.length;
}
