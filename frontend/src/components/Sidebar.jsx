import { motion } from 'framer-motion';
import { LayoutDashboard, Search, DollarSign, Clock, FlaskConical, Settings, Zap } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import clsx from 'clsx';

const NAV = [
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
    <aside className="w-[250px] h-screen flex flex-col bg-navy-800/80 backdrop-blur-xl border-r border-white/[0.04] relative z-20">
      {/* Brand */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-glow-cyan">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-[14px] font-bold tracking-tight text-gradient">RazorRescue</h1>
            <p className="text-[9px] text-white/20 tracking-[0.12em] uppercase font-medium">Revenue Recovery</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setView(item.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-medium transition-all duration-200 relative',
                  active
                    ? 'text-white bg-white/[0.06]'
                    : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
                )}
                whileHover={{ x: 1 }}
                whileTap={{ scale: 0.98 }}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl bg-white/[0.06] border border-white/[0.06]"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                )}
                <Icon className={clsx('w-4 h-4 relative z-10', active && 'text-cyan-400')} />
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Status */}
      <div className="p-3 border-t border-white/[0.04]">
        <div className="card-glass p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            <span className="text-[10px] text-emerald/80 font-medium">AI Monitoring</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan/[0.1] flex items-center justify-center text-[10px]">🏪</div>
            <div>
              <p className="text-[11px] font-semibold text-white/80">{merchant.name}</p>
              <p className="text-[9px] text-white/20">{merchant.totalTransactions.toLocaleString()} txns</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
