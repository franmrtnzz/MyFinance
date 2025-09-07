import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, RefreshCcw } from 'lucide-react';
import { usePortfolio } from '../hooks/usePortfolio';
import type { PortfolioCategory } from '../database/db';
import { useLoans } from '../hooks/useLoans';

const CATEGORIES: { id: PortfolioCategory; label: string }[] = [
  { id: 'inmueble', label: 'Inmueble' },
  { id: 'vehiculo', label: 'Vehículo' },
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'deposito', label: 'Depósito' },
  { id: 'accion', label: 'Acción' },
  { id: 'etf', label: 'ETF' },
  { id: 'bono', label: 'Bono' },
  { id: 'fondo', label: 'Fondo' },
  { id: 'cripto', label: 'Cripto' },
  { id: 'materia_prima', label: 'Materia prima' },
  { id: 'divisa', label: 'Divisa' },
  { id: 'otros', label: 'Otros' },
];

export const PortfolioPage: React.FC = () => {
  const { txs, addTx, deleteTx, withPrices } = usePortfolio();
  const { loans, addLoan, deleteLoan, addPayment, deletePayment } = useLoans();
  const [asset, setAsset] = useState('');
  const [symbol, setSymbol] = useState('');
  const [category, setCategory] = useState<PortfolioCategory>('accion');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [holdings, setHoldings] = useState<any[]>([]);

  // Loan form state
  const [borrower, setBorrower] = useState('');
  const [principal, setPrincipal] = useState('');
  const [annualRate, setAnnualRate] = useState('5');
  const [loanDate, setLoanDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [loanNotes, setLoanNotes] = useState('');

  const canSave = asset.trim() && Number(price) > 0 && Number(quantity) !== 0 && date;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await addTx({
        asset: asset.trim(),
        symbol: symbol.trim() || undefined,
        category,
        price: Number(price),
        quantity: Number(quantity),
        date,
        notes: notes.trim() || undefined,
      } as any);
      setAsset('');
      setSymbol('');
      setPrice('');
      setQuantity('');
      setNotes('');
      await refreshHoldings();
    } catch (err) {
      alert((err as Error).message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const refreshHoldings = async () => {
    const h = await withPrices();
    setHoldings(h);
  };

  useEffect(() => {
    refreshHoldings();
  }, [txs.length]);

  const total = useMemo(() => holdings.reduce((s, h) => s + h.quantity * h.avgCost, 0), [holdings]);
  const loansTotal = useMemo(
    () => loans.reduce((s, l) => s + Math.max(0, l.outstanding), 0),
    [loans],
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Portfolio</h2>

      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Activo (ej. ASML)"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
          />
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Símbolo/Ticker o ID (ej. ASML.AS, BTC)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={category}
            onChange={(e) => setCategory(e.target.value as PortfolioCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Precio compra (€)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Unidades/Cantidad"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={2}
            placeholder="Notas (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={!canSave || saving}
          className="px-4 py-2 rounded-md bg-green-600 text-white disabled:bg-gray-300"
        >
          <Plus className="w-4 h-4 inline mr-2" /> Añadir compra
        </button>
      </form>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Posiciones (valor a precio de coste)</h3>
        <button onClick={refreshHoldings} className="px-3 py-2 rounded-md bg-blue-600 text-white">
          <RefreshCcw className="w-4 h-4 inline mr-2" />
          Actualizar
        </button>
      </div>
      {holdings.length === 0 ? (
        <p className="text-gray-500">Sin posiciones todavía</p>
      ) : (
        <div className="space-y-2">
          {holdings.map((h: any, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">
                  {h.asset} {h.symbol && <span className="text-gray-500">({h.symbol})</span>}
                </p>
                <p className="text-sm text-gray-600">
                  {h.quantity.toFixed(4)} u • Coste medio {h.avgCost.toFixed(2)}€
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{(h.quantity * h.avgCost).toFixed(2)}€</p>
              </div>
            </div>
          ))}
          <div className="p-3 bg-white border rounded-lg flex justify-between">
            <span className="font-semibold">Valor total</span>
            <span className="font-bold">{total.toFixed(2)}€</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Préstamos (derechos de cobro)</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!borrower.trim() || Number(principal) <= 0) return;
            try {
              await addLoan({
                borrower: borrower.trim(),
                principal: Number(principal),
                annualRate: Number(annualRate || '0'),
                startDate: loanDate,
                notes: loanNotes.trim() || undefined,
              } as any);
              setBorrower('');
              setPrincipal('');
              setLoanNotes('');
            } catch (err) {
              alert((err as Error).message);
            }
          }}
          className="grid grid-cols-1 gap-3"
        >
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Prestatario"
            value={borrower}
            onChange={(e) => setBorrower(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              className="px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Principal (€)"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
            />
            <input
              className="px-3 py-2 border border-gray-300 rounded-md"
              placeholder="% anual"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
            />
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-md"
              value={loanDate}
              onChange={(e) => setLoanDate(e.target.value)}
            />
          </div>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={2}
            placeholder="Notas"
            value={loanNotes}
            onChange={(e) => setLoanNotes(e.target.value)}
          />
          <button className="px-4 py-2 rounded-md bg-purple-600 text-white" type="submit">
            Registrar préstamo
          </button>
        </form>

        {loans.length === 0 ? (
          <p className="text-gray-500">Sin préstamos registrados</p>
        ) : (
          <div className="space-y-2">
            {loans.map((l) => (
              <div key={l.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{l.borrower}</p>
                    <p className="text-sm text-gray-600">
                      Principal {l.principal.toFixed(2)}€ • {l.annualRate}% anual • desde{' '}
                      {new Date(l.startDate).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      Pendiente {Math.max(0, l.outstanding).toFixed(2)}€
                    </p>
                    <button
                      onClick={() => l.id && deleteLoan(l.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Interés devengado: {Math.max(0, l.accruedInterest).toFixed(2)}€ • Cobrado:{' '}
                  {l.received.toFixed(2)}€
                </div>
                <LoanPaymentForm loanId={l.id as number} onAdd={addPayment} />
                <LoanPaymentsList loanId={l.id as number} onDelete={deletePayment} />
              </div>
            ))}
            <div className="p-3 bg-white border rounded-lg flex justify-between">
              <span className="font-semibold">Valor préstamos pendiente</span>
              <span className="font-bold">{loansTotal.toFixed(2)}€</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Transacciones</h3>
        {txs.length === 0 ? (
          <p className="text-gray-500">Sin transacciones</p>
        ) : (
          <div className="space-y-2">
            {txs
              .slice()
              .reverse()
              .map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-gray-50 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {t.asset} {t.symbol && `(${t.symbol})`} • {t.quantity} u a {t.price}€
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(t.date).toLocaleDateString('es-ES')} • {t.category}
                    </p>
                  </div>
                  <button
                    onClick={() => t.id && deleteTx(t.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LoanPaymentForm: React.FC<{
  loanId: number;
  onAdd: (loanId: number, date: string, amount: number) => Promise<void>;
}> = ({ loanId, onAdd }) => {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (Number(amount) <= 0) return;
        await onAdd(loanId, date, Number(amount));
        setAmount('');
      }}
      className="mt-2 flex gap-2 flex-wrap items-center"
    >
      <input
        type="date"
        className="px-3 py-1 border border-gray-300 rounded-md"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        className="px-3 py-1 border border-gray-300 rounded-md"
        placeholder="Cobro (€)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button className="px-3 py-1 rounded-md bg-green-600 text-white" type="submit">
        Registrar cobro
      </button>
    </form>
  );
};

const LoanPaymentsList: React.FC<{ loanId: number; onDelete: (id: number) => Promise<void> }> = ({
  loanId,
  onDelete,
}) => {
  const { listPayments } = useLoans();
  const payments = listPayments(loanId);
  if (payments.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {payments.map((p) => (
        <div key={p.id} className="text-sm flex justify-between items-center">
          <span>
            {new Date(p.date).toLocaleDateString('es-ES')} • {p.amount.toFixed(2)}€
          </span>
          <button
            onClick={() => p.id && onDelete(p.id)}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
