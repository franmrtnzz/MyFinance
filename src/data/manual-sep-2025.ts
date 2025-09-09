import type { Transaction } from '../types';

export const manualSeptember2025: Array<Omit<Transaction, 'id' | 'createdAt'>> = [
  // Capturas 1-3
  { date: '2025-09-05', type: 'expense', description: 'Papa (Bizum)', amount: 18.0, category: 'Otros' },
  { date: '2025-09-03', type: 'income', description: 'JOSE JOAQUIN COBARRO FERNANDEZ (Bizum)', amount: 18.0, category: 'Otros' },
  { date: '2025-09-02', type: 'income', description: 'FRANCISCO CERVANTES MARTINEZ', amount: 735.0, category: 'Otros' },
  { date: '2025-09-02', type: 'expense', description: 'Euro Overnight Rate Swap EUR (Acc) · Plan ejecutado', amount: 50.0, category: 'Otros' },
  { date: '2025-09-02', type: 'expense', description: 'Euro Overnight Rate Swap EUR (Acc) · Saveback', amount: 8.84, category: 'Otros' },
  { date: '2025-09-01', type: 'expense', description: 'Diego (Bizum)', amount: 11.56, category: 'Otros' },
  { date: '2025-09-01', type: 'income', description: 'Interés', amount: 2.16, category: 'Otros' },
  { date: '2025-09-01', type: 'expense', description: 'Registro de la Propiedad España', amount: 150.0, category: 'Otros' },

  { date: '2025-09-09', type: 'expense', description: 'Amazon', amount: 6.66, category: 'Compras' },
  { date: '2025-09-09', type: 'expense', description: 'Cursor', amount: 17.09, category: 'Servicios' },
  { date: '2025-09-06', type: 'income', description: 'Diego Bernabé López (Bizum)', amount: 7.5, category: 'Otros' },
  { date: '2025-09-06', type: 'expense', description: 'Toros Kebab', amount: 19.3, category: 'Comida' },
  { date: '2025-09-06', type: 'expense', description: 'Mazorca Maix (Bizum)', amount: 3.0, category: 'Otros' },
  { date: '2025-09-06', type: 'expense', description: 'Diego (Bizum)', amount: 0.5, category: 'Otros' },
  { date: '2025-09-06', type: 'expense', description: 'Diego (Bizum)', amount: 2.0, category: 'Otros' },
  { date: '2025-09-06', type: 'expense', description: 'Plenoil', amount: 20.0, category: 'Transporte' },
  { date: '2025-09-09', type: 'expense', description: 'Papa (Bizum)', amount: 24.9, category: 'Otros' },
  { date: '2025-09-09', type: 'expense', description: 'Amazon', amount: 19.85, category: 'Compras' },

  // Extracto bancario
  { date: '2025-09-08', type: 'expense', description: 'Compra Alimentación', amount: 3.4, category: 'Comida' },
  { date: '2025-09-04', type: 'income', description: 'Abono transferencia de Inversus', amount: 150.0, category: 'Otros' },
  { date: '2025-09-04', type: 'income', description: 'Abono transferencia de Inversus', amount: 30.0, category: 'Otros' },
  { date: '2025-09-03', type: 'expense', description: 'Compra combustible', amount: 30.0, category: 'Transporte' },
  { date: '2025-09-03', type: 'expense', description: 'Compra aparcamiento', amount: 1.65, category: 'Transporte' },
  { date: '2025-09-03', type: 'expense', description: 'Compra Mercadona', amount: 2.85, category: 'Comida' },
  { date: '2025-09-02', type: 'expense', description: 'Transferencia a Trade Republic ESP', amount: 735.0, category: 'Inversiones' },
  { date: '2025-09-01', type: 'expense', description: 'Adeudo recibo Basic-Fit Spain S.A.U (BNP)', amount: 24.9, category: 'Servicios' },
  { date: '2025-09-01', type: 'expense', description: 'Compra TRIPS SUMM', amount: 6.0, category: 'Otros' },
]; 