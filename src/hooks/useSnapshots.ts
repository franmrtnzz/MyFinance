import { useEffect, useState } from 'react';
import { db, type MonthlySnapshot } from '../database/db';

export const useSnapshots = () => {
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const all = await db.monthlySnapshots.orderBy('[year+month]').toArray();
      setSnapshots(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { snapshots, loading, refresh: load };
};
