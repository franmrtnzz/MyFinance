import React, { useMemo } from 'react';
import { useSnapshots } from '../hooks/useSnapshots';

function formatMonth(y: number, m: number) {
  return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export const AnalyticsPage: React.FC = () => {
  const { snapshots } = useSnapshots();

  const kpis = useMemo(() => {
    if (snapshots.length === 0) return null;
    const last3 = snapshots.slice(-3);
    const avgBalance = last3.reduce((s, x) => s + x.balance, 0) / last3.length;
    const avgIncome = last3.reduce((s, x) => s + x.totalIncome, 0) / last3.length;
    const avgExpenses = last3.reduce((s, x) => s + x.totalExpenses, 0) / last3.length;
    const best = snapshots.reduce((p, c) => (c.balance > p.balance ? c : p));
    const worst = snapshots.reduce((p, c) => (c.balance < p.balance ? c : p));
    const savingsRate = avgIncome > 0 ? (1 - avgExpenses / avgIncome) * 100 : 0;
    return { avgBalance, avgIncome, avgExpenses, best, worst, savingsRate };
  }, [snapshots]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Analíticas</h2>

      {!snapshots || snapshots.length === 0 ? (
        <p className="text-gray-500">
          Aún no hay meses cerrados. Cierra al menos un mes para ver analíticas.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <KPI title="Saldo medio (3 meses)" value={`${kpis!.avgBalance.toFixed(2)}€`} />
            <KPI title="Tasa de ahorro media" value={`${kpis!.savingsRate.toFixed(1)}%`} />
            <KPI title="Ingresos medios (3 meses)" value={`${kpis!.avgIncome.toFixed(2)}€`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <KPI
              title={`Mejor mes (${formatMonth(kpis!.best.year, kpis!.best.month)})`}
              value={`${kpis!.best.balance.toFixed(2)}€`}
              subtle={`Ingresos ${kpis!.best.totalIncome.toFixed(2)}€ • Gastos ${kpis!.best.totalExpenses.toFixed(2)}€`}
            />
            <KPI
              title={`Peor mes (${formatMonth(kpis!.worst.year, kpis!.worst.month)})`}
              value={`${kpis!.worst.balance.toFixed(2)}€`}
              subtle={`Ingresos ${kpis!.worst.totalIncome.toFixed(2)}€ • Gastos ${kpis!.worst.totalExpenses.toFixed(2)}€`}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Histórico</h3>
            <div className="space-y-2">
              {snapshots
                .slice()
                .reverse()
                .map((s) => (
                  <div
                    key={`${s.year}-${s.month}`}
                    className="p-3 bg-gray-50 rounded-lg flex justify-between"
                  >
                    <span className="capitalize">{formatMonth(s.year, s.month)}</span>
                    <span className="font-medium">{s.balance.toFixed(2)}€</span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const KPI: React.FC<{ title: string; value: string; subtle?: string }> = ({
  title,
  value,
  subtle,
}) => (
  <div className="p-4 bg-gray-50 rounded-lg border">
    <div className="text-sm text-gray-600 mb-1">{title}</div>
    <div className="text-xl font-bold">{value}</div>
    {subtle && <div className="text-xs text-gray-500 mt-1">{subtle}</div>}
  </div>
);
