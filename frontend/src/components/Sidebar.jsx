import { motion } from 'framer-motion';
import { LayoutDashboard, Search, DollarSign, Clock, FlaskConical, Settings, Zap } from 'lucide-react';
import clsx from 'clsx';
import { useAppState } from '../hooks/useAppState';

const NAV_ITEMS = [
  { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
  { id: 'investigation', label: 'Investigation', icon: Search },
  { id: 'recovery', label: 'Recovery', icon: DollarSign },
  { id: 'timeline', label: 'AI Timeline', icon: Clock },
  { id: 'simulate', label: 'Simulate', icon: FlaskConical },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ view, setView }) {
  const { merchant } = useAppState();

  return (
    <aside className="w-[260px] h-screen flex flex-col bg-surface-1/80 backdrop-blur-xl border-r border-white/[0.06] relative z-10">
      {/* Brand */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-violet flex items-center justify-center shadow-glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight gradient-text">RazorRescue</h1>
            <p className="text-[10px] text-white/30 tracking-[0.1em] uppercase font-medium">Revenue Recovery</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setView(item.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative group',
                  isActive
                    ? 'text-white bg-white/[0.08]'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                )}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.08]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={clsx('w-4 h-4 relative z-10', isActive && 'text-accent-light')} />
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Status Bar */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="glass p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span className="text-[11px] text-emerald font-medium">AI Monitoring</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center text-[10px]">🏪</div>
            <div>
              <p className="text-[12px] font-semibold text-white/90">{merchant.name}</p>
              <p className="text-[10px] text-white/30">{merchant.totalTransactions.toLocaleString()} txns</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
