import { useState, useEffect } from 'react';
// local db no longer used here after Supabase migration
import { db } from '../database/db';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/device';
import { getNow } from '../utils/now';
import type { Transaction, MonthlySummary } from '../types';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      const allTransactions = await db.transactions.orderBy('date').reverse().toArray();
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Snapshot previous month totals locally and clear those transactions
  const ensurePreviousMonthSnapshot = async () => {
    const now = getNow();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = prev.getFullYear();
    const month = prev.getMonth() + 1;
    const existing = await db.monthlySnapshots.where({ year, month }).first();
    if (existing) return;
    const monthStr = month.toString().padStart(2, '0');
    const monthTx = await db.transactions
      .filter((t) => t.date.startsWith(`${year}-${monthStr}`))
      .toArray();
    if (monthTx.length === 0) return;
    const totalIncome = monthTx
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const totalExpenses = monthTx
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    await db.monthlySnapshots.add({
      year,
      month,
      totalIncome,
      totalExpenses,
      balance,
      closedAt: new Date(),
    });
    await db.transactions.bulkDelete(monthTx.map((t) => t.id as number));
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const newTransaction = { ...transaction, createdAt: new Date() };
      const id = await db.transactions.add(newTransaction);
      await loadTransactions();
      // Backup en Supabase por dispositivo
      try {
        const deviceId = getDeviceId();
        await supabase.from('transactions').insert({
          user_id: deviceId /* usamos user_id como device_id */,
          date: transaction.date,
          type: transaction.type,
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category || null,
        });
      } catch (e) {
        console.warn('Backup (insert) fallido, se ignora:', e);
      }
      return id;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const isDateInCurrentMonth = (dateStr: string): boolean => {
    const [y, m] = dateStr.split('-');
    const now = getNow();
    const currentYear = now.getFullYear().toString();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    return y === currentYear && m === currentMonth;
  };

  const isMonthEditable = (year: number, month: number): boolean => {
    const now = getNow();
    return now.getFullYear() === year && now.getMonth() + 1 === month;
  };

  const isTransactionEditable = (t: Transaction): boolean => {
    return isDateInCurrentMonth(t.date);
  };

  const deleteTransaction = async (id: number) => {
    try {
      const existing = await db.transactions.get(id);
      if (!existing) return;
      if (!isTransactionEditable(existing)) {
        throw new Error('MONTH_CLOSED');
      }
      await db.transactions.delete(id);
      await loadTransactions();
      // Borra del backup
      try {
        const deviceId = getDeviceId();
        await supabase
          .from('transactions')
          .delete()
          .eq('user_id', deviceId)
          .eq('date', existing.date)
          .eq('type', existing.type)
          .eq('description', existing.description)
          .eq('amount', existing.amount);
      } catch (e) {
        console.warn('Backup (delete) fallido, se ignora:', e);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const getMonthlySummary = (year: number, month: number): MonthlySummary => {
    const monthStr = month.toString().padStart(2, '0');
    const monthTransactions = transactions.filter((t) => t.date.startsWith(`${year}-${monthStr}`));

    const totalIncome = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month: monthStr,
      year,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount: monthTransactions.length,
    };
  };

  const getCurrentMonthSummary = (): MonthlySummary => {
    const now = new Date();
    return getMonthlySummary(now.getFullYear(), now.getMonth() + 1);
  };

  useEffect(() => {
    ensurePreviousMonthSnapshot().then(loadTransactions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    isMonthEditable,
    isTransactionEditable,
    getMonthlySummary,
    getCurrentMonthSummary,
    ensurePreviousMonthSnapshot,
    refreshTransactions: loadTransactions,
  };
};
