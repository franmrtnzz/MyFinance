import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Euro, Calendar, Trash2, Lock } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
// import type { Transaction } from '../types';

interface MonthlyDashboardProps {
  year: number;
  month: number;
}

export const MonthlyDashboard: React.FC<MonthlyDashboardProps> = ({ year, month }) => {
  const { transactions, getMonthlySummary, deleteTransaction, isMonthEditable } = useTransactions();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const summary = getMonthlySummary(year, month);
  const monthName = new Date(year, month - 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const monthTransactions = transactions.filter((t) =>
    t.date.startsWith(`${year}-${month.toString().padStart(2, '0')}`),
  );

  const recentTransactions = monthTransactions.slice(0, 5);
  const monthIsEditable = isMonthEditable(year, month);

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres borrar esta transacción?')) {
      setDeletingId(id);
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Error al borrar la transacción');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 capitalize">{monthName}</h2>
        <div className="flex items-center text-gray-500">
          {!monthIsEditable && (
            <span className="flex items-center text-red-600 mr-3">
              <Lock className="w-4 h-4 mr-1" /> Solo lectura
            </span>
          )}
          <Calendar className="w-4 h-4 mr-1" />
          {monthTransactions.length} transacciones
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Ingresos</p>
              <p className="text-2xl font-bold text-green-700">{summary.totalIncome.toFixed(2)}€</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Gastos</p>
              <p className="text-2xl font-bold text-red-700">{summary.totalExpenses.toFixed(2)}€</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            summary.balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                Saldo
              </p>
              <p
                className={`text-2xl font-bold ${
                  summary.balance >= 0 ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {summary.balance.toFixed(2)}€
              </p>
            </div>
            <Euro
              className={`w-8 h-8 ${summary.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}
            />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Últimas transacciones</h3>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay transacciones este mes</p>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{transaction.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString('es-ES')}
                    {transaction.category && ` • ${transaction.category}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {transaction.amount.toFixed(2)}€
                  </div>
                  {monthIsEditable && (
                    <button
                      onClick={() => transaction.id && handleDelete(transaction.id)}
                      disabled={deletingId === transaction.id}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Borrar transacción"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
