import React, { useState } from 'react';
import { Trash2, Calendar, Lock } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';

export const TransactionsList: React.FC = () => {
  const { transactions, deleteTransaction, isTransactionEditable } = useTransactions();
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  // Group transactions by month
  const groupedTransactions = transactions.reduce(
    (groups, transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
      });

      if (!groups[monthKey]) {
        groups[monthKey] = {
          monthName,
          transactions: [],
        };
      }
      groups[monthKey].transactions.push(transaction);
      return groups;
    },
    {} as Record<string, { monthName: string; transactions: typeof transactions }>,
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Todas las transacciones</h2>
        <div className="flex items-center text-gray-500">
          <Calendar className="w-4 h-4 mr-1" />
          {transactions.length} transacciones
        </div>
      </div>

      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay transacciones registradas</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions)
            .sort(([a], [b]) => b.localeCompare(a)) // Sort by month descending
            .map(([monthKey, { monthName, transactions: monthTransactions }]) => (
              <div key={monthKey}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 capitalize">{monthName}</h3>
                <div className="space-y-2">
                  {monthTransactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending
                    .map((transaction) => (
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
                          {isTransactionEditable(transaction) ? (
                            <button
                              onClick={() => transaction.id && handleDelete(transaction.id)}
                              disabled={deletingId === transaction.id}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Borrar transacción"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-gray-400" title="Mes cerrado">
                              <Lock className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
