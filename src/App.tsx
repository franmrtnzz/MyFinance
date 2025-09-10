import React from 'react';
import { useState } from 'react';
import { QuickTransactionForm } from './components/QuickTransactionForm';
import { MonthlyDashboard } from './components/MonthlyDashboard';
import { TransactionsList } from './components/TransactionsList';
import { NotesPage } from './components/NotesPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { Navigation } from './components/Navigation';
import { SettingsPage } from './components/SettingsPage';
import { useTransactions } from './hooks/useTransactions';
import { AuthGate } from './components/AuthGate';
import { MobileOnlyGate } from './components/MobileOnlyGate';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect } from 'react';
import { db } from './database/db';
import { getDeviceId } from './lib/device';
import { restoreAllFromCloud } from './lib/cloudSync';
import { manualSeptember2025 } from './data/manual-sep-2025';
import { replaceTransactionsInCloudForUser } from './lib/cloudSync';
import { BUILD_VERSION } from './version';

// Touch the React value to satisfy editors that require React in scope for JSX
void React;

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const { getCurrentMonthSummary, addTransaction } = useTransactions();
  useEffect(() => {
    (async () => {
      const counts = await Promise.all([
        db.transactions.count(),
        db.notes?.count?.() ?? Promise.resolve(0),
        db.portfolioTx.count(),
        db.loans.count(),
      ]);
      const total = counts.reduce((a, b) => a + (b || 0), 0);
      if (total === 0) {
        try {
          await restoreAllFromCloud(getDeviceId());
        } catch (e) {
          console.warn('Restore from cloud failed (ignored):', e);
        }
      }
    })();
  }, []);

  // One-time manual import for September 2025 based on user-provided screenshots
  useEffect(() => {
    (async () => {
      const guardKey = 'manual_import_sep_2025_done';
      if (localStorage.getItem(guardKey) === '1') return;
      try {
        const existing = await db.transactions
          .where('date')
          .between('2025-09-01', '2025-09-30', true, true)
          .count();
        // Avoid flooding if already has many entries
        if (existing >= manualSeptember2025.length / 2) {
          localStorage.setItem(guardKey, '1');
          return;
        }
        for (const t of manualSeptember2025) {
          await addTransaction(t);
        }
        localStorage.setItem(guardKey, '1');
        console.log('Manual September 2025 data imported');
      } catch (e) {
        console.warn('Manual import failed (ignored):', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dev-only: push manual September data to a specific Supabase user_id once
  useEffect(() => {
    (async () => {
      const guardKey = 'manual_push_sep_2025_user13a5_done';
      if (localStorage.getItem(guardKey) === '1') return;
      if (import.meta.env.PROD) return; // avoid in prod builds
      try {
        const userId = '13a59b48-dc39-a9ed-0b81-b9bc776cfdbd';
        await replaceTransactionsInCloudForUser(
          userId,
          manualSeptember2025,
          '2025-09-01',
          '2025-09-30',
        );
        localStorage.setItem(guardKey, '1');
        console.log('Pushed manual September 2025 to Supabase for user', userId);
      } catch (e) {
        console.warn('Cloud push failed (ignored):', e);
      }
    })();
  }, []);

  const currentSummary = getCurrentMonthSummary();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
              <h1 className="text-2xl font-bold mb-4">MyFinance</h1>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm opacity-90">Saldo del mes</p>
                  <p className="text-xl font-bold">
                    {currentSummary.balance.toFixed(2)}€
                  </p>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm opacity-90">Transacciones</p>
                  <p className="text-xl font-bold">
                    {currentSummary.transactionCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setActiveTab('add:expense')}
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <TrendingDown className="w-5 h-5" />
                <span>Nuevo Gasto</span>
              </button>
              <button
                onClick={() => setActiveTab('add:income')}
                className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <TrendingUp className="w-5 h-5" />
                <span>Nuevo Ingreso</span>
              </button>
            </div>

            {/* Current Month Summary */}
            <MonthlyDashboard year={currentYear} month={currentMonth} />
          </div>
        );

      case 'add':
      case 'add:expense':
      case 'add:income': {
        const initialType = activeTab === 'add:income' ? 'income' : 'expense';
        return (
          <QuickTransactionForm
            onTransactionAdded={() => setActiveTab('home')}
            onCancel={() => setActiveTab('home')}
            initialType={initialType}
          />
        );
      }

      case 'transactions':
        return (
          <div className="space-y-6">
            <TransactionsList />
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6">
            <MonthlyDashboard year={currentYear} month={currentMonth} />
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-6">
            <NotesPage />
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <AnalyticsPage />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <SettingsPage />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MobileOnlyGate>
      <AuthGate>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-md mx-auto bg-white min-h-screen">
            <div className="p-4 pb-20">{renderContent()}</div>
            <div className="text-center text-xs text-gray-400 pb-16">{BUILD_VERSION}</div>
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </AuthGate>
    </MobileOnlyGate>
  );
}

export default App;
