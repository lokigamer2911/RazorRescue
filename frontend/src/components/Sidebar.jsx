import { motion } from 'framer-motion';
import { SquaresFour, MagnifyingGlass, CurrencyInr, Clock, Flask, GearSix, Lightning, ArrowLeft, SignOut } from '@phosphor-icons/react';
import { useAppState } from '../hooks/useAppState';
import { useAuth } from '../hooks/useAuth';
import clsx from 'clsx';

const NAV = [
  { id: 'command-center', label: 'Command Center', icon: SquaresFour },
  { id: 'investigation', label: 'Investigation', icon: MagnifyingGlass },
  { id: 'recovery', label: 'Recovery', icon: CurrencyInr },
  { id: 'timeline', label: 'AI Timeline', icon: Clock },
  { id: 'simulate', label: 'Simulate', icon: Flask },
  { id: 'settings', label: 'Settings', icon: GearSix },
];

export default function Sidebar({ view, setView, onHome, onLogout }) {
  const { merchant } = useAppState();
  const { user } = useAuth();

  return (
    <aside className="w-[240px] h-screen flex flex-col bg-white border-r border-gray-200">
      {/* Brand */}
      <div className="p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Lightning weight="fill" className="w-4 h-4 text-white" />
          </div>
          <span className="text-[14px] font-bold tracking-tight text-gray-900">RazorRescue</span>
        </div>
        <button onClick={onHome} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Back to landing">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button key={item.id} onClick={() => setView(item.id)}
                className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-medium transition-all',
                  active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')}>
                <Icon className={clsx('w-4 h-4', active && 'text-white')} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-emerald-600 font-medium">AI Monitoring</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-[10px]">🏪</div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-800 truncate">{user?.displayName || merchant.name}</p>
              <p className="text-[9px] text-gray-400 truncate">{user?.email || `${merchant.totalTransactions.toLocaleString()} txns`}</p>
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-[11.5px] font-medium text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all">
          <SignOut weight="fill" className="w-3.5 h-3.5" />
          Log out
        </button>
      </div>
    </aside>
  );
}