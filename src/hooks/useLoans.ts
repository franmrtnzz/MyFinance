import { useEffect, useMemo, useState } from 'react';
import { db, type Loan, type LoanPayment } from '../database/db';
import { getNow } from '../utils/now';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/device';

export interface LoanWithValue extends Loan {
  received: number;
  accruedInterest: number; // simple interest from start to now on remaining principal
  outstanding: number; // principal + accruedInterest - received
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [ls, ps] = await Promise.all([db.loans.toArray(), db.loanPayments.toArray()]);
      setLoans(ls);
      setPayments(ps);
    } finally {
      setLoading(false);
    }
  };

  const addLoan = async (input: Omit<Loan, 'id' | 'createdAt'>) => {
    // editable only in current month
    const [y, m] = input.startDate.split('-');
    const now = getNow();
    if (now.getFullYear() !== Number(y) || now.getMonth() + 1 !== Number(m)) {
      throw new Error('MONTH_CLOSED');
    }
    await db.loans.add({ ...input, createdAt: new Date() });
    await load();
    // Backup en Supabase
    try {
      const deviceId = getDeviceId();
      await supabase.from('loans').insert({
        user_id: deviceId,
        borrower: input.borrower,
        principal: input.principal,
        annual_rate: input.annualRate,
        start_date: input.startDate,
        notes: input.notes || null,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Backup loans (insert) fallido, se ignora:', e);
    }
  };

  const deleteLoan = async (id: number) => {
    const loan = await db.loans.get(id);
    if (!loan) return;
    const [y, m] = loan.startDate.split('-');
    const now = getNow();
    if (now.getFullYear() !== Number(y) || now.getMonth() + 1 !== Number(m)) {
      throw new Error('MONTH_CLOSED');
    }
    await db.loans.delete(id);
    await db.loanPayments.where('loanId').equals(id).delete();
    await load();
    // Backup en Supabase
    try {
      const deviceId = getDeviceId();
      await supabase
        .from('loans')
        .delete()
        .eq('user_id', deviceId)
        .eq('borrower', loan.borrower)
        .eq('principal', loan.principal)
        .eq('annual_rate', loan.annualRate)
        .eq('start_date', loan.startDate);
      await supabase
        .from('loan_payments')
        .delete()
        .eq('user_id', deviceId)
        .eq('loan_borrower', loan.borrower)
        .eq('loan_start_date', loan.startDate);
    } catch (e) {
      console.warn('Backup loans (delete) fallido, se ignora:', e);
    }
  };

  const addPayment = async (loanId: number, date: string, amount: number) => {
    const [y, m] = date.split('-');
    const now = getNow();
    if (now.getFullYear() !== Number(y) || now.getMonth() + 1 !== Number(m)) {
      throw new Error('MONTH_CLOSED');
    }
    await db.loanPayments.add({ loanId, date, amount });
    await load();
    // Backup en Supabase
    try {
      const loan = await db.loans.get(loanId);
      if (loan) {
        const deviceId = getDeviceId();
        await supabase.from('loan_payments').insert({
          user_id: deviceId,
          loan_borrower: loan.borrower,
          loan_start_date: loan.startDate,
          date,
          amount,
        });
      }
    } catch (e) {
      console.warn('Backup loan payments (insert) fallido, se ignora:', e);
    }
  };

  const deletePayment = async (id: number) => {
    const p = await db.loanPayments.get(id);
    if (!p) return;
    const [y, m] = p.date.split('-');
    const now = getNow();
    if (now.getFullYear() !== Number(y) || now.getMonth() + 1 !== Number(m)) {
      throw new Error('MONTH_CLOSED');
    }
    await db.loanPayments.delete(id);
    await load();
    // Backup en Supabase
    try {
      const loan = await db.loans.get(p.loanId);
      if (loan) {
        const deviceId = getDeviceId();
        await supabase
          .from('loan_payments')
          .delete()
          .eq('user_id', deviceId)
          .eq('loan_borrower', loan.borrower)
          .eq('loan_start_date', loan.startDate)
          .eq('date', p.date)
          .eq('amount', p.amount);
      }
    } catch (e) {
      console.warn('Backup loan payments (delete) fallido, se ignora:', e);
    }
  };

  const loansWithValue: LoanWithValue[] = useMemo(() => {
    const now = getNow();
    return loans.map((l) => {
      const rec = payments
        .filter((p) => p.loanId === (l.id as number))
        .reduce((s, p) => s + p.amount, 0);
      const days = Math.max(0, daysBetween(new Date(l.startDate), now));
      const accrued = (l.principal * (l.annualRate / 100) * days) / 365;
      const outstanding = l.principal + accrued - rec;
      return { ...l, received: rec, accruedInterest: accrued, outstanding };
    });
  }, [loans, payments]);

  const listPayments = (loanId: number) =>
    payments
      .filter((p) => p.loanId === loanId)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));

  useEffect(() => {
    load();
  }, []);

  return {
    loans: loansWithValue,
    loading,
    addLoan,
    deleteLoan,
    addPayment,
    deletePayment,
    listPayments,
    refresh: load,
  };
};
