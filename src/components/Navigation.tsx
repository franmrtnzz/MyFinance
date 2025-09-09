import React from 'react';
import {
  Plus,
  BarChart3,
  Settings,
  Home,
  List,
  StickyNote,
  LineChart,
  Upload,
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'add', label: 'Añadir', icon: Plus },
    { id: 'transactions', label: 'Lista', icon: List },
    { id: 'notes', label: 'Notas', icon: StickyNote },
    { id: 'analytics', label: 'Analíticas', icon: LineChart },
    { id: 'dashboard', label: 'Resumen', icon: BarChart3 },
    { id: 'import', label: 'Importar', icon: Upload },
    { id: 'settings', label: 'Config', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors touch-manipulation ${
                isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
