import { useEffect, useMemo, useState } from 'react';
import { db, type PortfolioTx, type PortfolioCategory } from '../database/db';
import { getNow } from '../utils/now';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/device';

export interface HoldingSummary {
  asset: string;
  symbol?: string;
  category: PortfolioCategory;
  quantity: number;
  avgCost: number; // EUR per unit
  costBasis: number; // EUR
}

export const usePortfolio = () => {
  const [txs, setTxs] = useState<PortfolioTx[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const all = await db.portfolioTx.orderBy('date').toArray();
      setTxs(all);
    } finally {
      setLoading(false);
    }
  };

  const addTx = async (input: Omit<PortfolioTx, 'id' | 'createdAt'>) => {
    // Respect month edit rule (only current month editable)
    const [y, m] = input.date.split('-');
    const now = getNow();
    if (now.getFullYear() !== Number(y) || now.getMonth() + 1 !== Number(m)) {
      throw new Error('MONTH_CLOSED');
    }
    const id = await db.portfolioTx.add({ ...input, createdAt: new Date() });
    await load();
    // Backup en Supabase
    try {
      const deviceId = getDeviceId();
      await supabase.from('portfolio_tx').insert({
        user_id: deviceId,
        date: input.date,
        asset: input.asset,
        symbol: input.symbol || null,
        category: input.category,
        price: input.price,
        quantity: input.quantity,
        notes: input.notes || null,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Backup portfolio (insert) fallido, se ignora:', e);
    }
    return id;
  };

  const deleteTx = async (id: number) => {
    const existing = await db.portfolioTx.get(id);
    if (!existing) return;
    const [y, m] = existing.date.split('-');
    const now = getNow();
    if (now.getFullYear() !== Number(y) || now.getMonth() + 1 !== Number(m)) {
      throw new Error('MONTH_CLOSED');
    }
    await db.portfolioTx.delete(id);
    await load();
    // Backup en Supabase
    try {
      const deviceId = getDeviceId();
      await supabase
        .from('portfolio_tx')
        .delete()
        .eq('user_id', deviceId)
        .eq('date', existing.date)
        .eq('asset', existing.asset)
        .eq('price', existing.price)
        .eq('quantity', existing.quantity);
    } catch (e) {
      console.warn('Backup portfolio (delete) fallido, se ignora:', e);
    }
  };

  const holdings: HoldingSummary[] = useMemo(() => {
    const map = new Map<string, HoldingSummary>();
    for (const t of txs) {
      const key = `${t.asset}|${t.symbol || ''}`;
      const h = map.get(key) || {
        asset: t.asset,
        symbol: t.symbol,
        category: t.category,
        quantity: 0,
        avgCost: 0,
        costBasis: 0,
      };
      const newQty = h.quantity + t.quantity;
      const newCostBasis = h.costBasis + t.price * t.quantity;
      h.quantity = newQty;
      h.costBasis = newCostBasis;
      h.avgCost = newQty !== 0 ? newCostBasis / newQty : 0;
      map.set(key, h);
    }
    // Remove zeroed positions
    return Array.from(map.values()).filter((h) => Math.abs(h.quantity) > 1e-9);
  }, [txs]);

  const withPrices = async (): Promise<HoldingSummary[]> => holdings.map((h) => ({ ...h }));

  useEffect(() => {
    load();
  }, []);

  return { txs, loading, addTx, deleteTx, holdings, withPrices, refresh: load };
};
