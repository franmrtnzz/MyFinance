import React, { useEffect, useState } from 'react';
import { Plus, Minus, Euro, Calendar } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
// import type { QuickTransaction } from '../types';

interface QuickTransactionFormProps {
  onTransactionAdded?: () => void;
  onCancel?: () => void;
  initialType?: 'income' | 'expense';
}

const COMMON_CATEGORIES = [
  'Comida',
  'Transporte',
  'Ocio',
  'Salud',
  'Compras',
  'Servicios',
  'Inversiones',
];

const COMMON_INCOME = ['Pago Outlier', 'Dividendos', 'Intereses', 'Freelance', 'Salario'];

export const QuickTransactionForm: React.FC<QuickTransactionFormProps> = ({
  onTransactionAdded,
  onCancel,
  initialType = 'expense',
}) => {
  const { addTransaction } = useTransactions();
  const [isExpense, setIsExpense] = useState(initialType === 'expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsExpense(initialType === 'expense');
  }, [initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount.trim()) return;

    setIsSubmitting(true);
    try {
      await addTransaction({
        date: new Date().toISOString().split('T')[0],
        type: isExpense ? 'expense' : 'income',
        description: description.trim(),
        amount: parseFloat(amount.replace(',', '.')),
        category: category || undefined,
      });

      // Reset form
      setDescription('');
      setAmount('');
      setCategory('');
      onTransactionAdded?.();
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = isExpense ? ['5', '10', '20', '50'] : ['100', '200', '500', '1000'];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setIsExpense(true)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              isExpense ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Minus className="w-4 h-4 mr-2" />
            Gasto
          </button>
          <button
            onClick={() => setIsExpense(false)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              !isExpense ? 'bg-green-500 text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ingreso
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isExpense ? '¿En qué gastaste?' : '¿De dónde viene el dinero?'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad (€)</label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-2 mt-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {quickAmount}€
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría (opcional)
          </label>
          <div className="flex flex-wrap gap-2">
            {(isExpense ? COMMON_CATEGORIES : COMMON_INCOME).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  category === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-md font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !description.trim() || !amount.trim()}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              isExpense
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } disabled:bg-gray-300 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? 'Guardando...' : `Añadir ${isExpense ? 'Gasto' : 'Ingreso'}`}
          </button>
        </div>
      </form>

      <div className="mt-4 text-center text-sm text-gray-500">
        <Calendar className="w-4 h-4 inline mr-1" />
        {new Date().toLocaleDateString('es-ES')}
      </div>
    </div>
  );
};
