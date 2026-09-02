import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Rocket, Shield, Lock, Eye, Zap, Check, X } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { formatCurrency } from '../utils/simulation';
import clsx from 'clsx';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

const AUTOPILOT_MODES = [
  { id: 'recommend', label: 'Recommend', emoji: '🟢', color: 'emerald' },
  { id: 'assisted', label: 'Assisted', emoji: '🟡', color: 'amber' },
  { id: 'autopilot', label: 'Autopilot', emoji: '🔴', color: 'rose' },
];

export default function Recovery() {
  const { autopilotMode, setAutopilotMode, addTimelineEntry, recoveryData, setRecoveryData, recoveryActive, setRecoveryActive } = useAppState();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Ready');

  const launchRecovery = async () => {
    if (recoveryActive) return;
    setRecoveryActive(true);
    setStatus('Initializing');
    addTimelineEntry({
      time: new Date().toTimeString().slice(0, 5),
      icon: '🚀', title: 'Recovery campaign initialized', desc: 'Starting multi-channel recovery for 312 customers', type: 'info',
    });

    const totalTarget = 312;
    let contacted = 0, recovered = 0, amount = 0;

    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
      contacted = Math.min(totalTarget, Math.round(totalTarget * (i + 1) / 12));
      recovered = Math.min(150, recovered + Math.round(3 + Math.random() * 15));
      amount = Math.min(49200, amount + Math.round(1200 + Math.random() * 3600));
      const prog = Math.min(100, Math.round((contacted / totalTarget) * 100));
      setProgress(prog);
      setRecoveryData({
        customersContacted: contacted,
        paymentsRecovered: recovered,
        amountRecovered: amount,
        recoveryRate: contacted > 0 ? Math.round((recovered / contacted) * 100) : 0,
        progress: prog,
      });

      if (i === 3) {
        setStatus('Running');
        addTimelineEntry({
          time: new Date().toTimeString().slice(0, 5),
          icon: '📨', title: `${contacted} customers contacted`, desc: 'Recovery links sent via SMS and Email', type: 'info',
        });
      }
      if (recovered > 40 && i === 6) {
        addTimelineEntry({
          time: new Date().toTimeString().slice(0, 5),
          icon: '💰', title: `${formatCurrency(amount)} recovered`, desc: `${recovered} payments successfully recovered`, type: 'success',
        });
      }
    }

    setStatus('Complete');
    addTimelineEntry({
      time: new Date().toTimeString().slice(0, 5),
      icon: '🎉', title: `Campaign complete — ${formatCurrency(amount)} recovered`, desc: `Recovery rate: ${Math.round((recovered / totalTarget) * 100)}%`, type: 'success',
    });
  };

  const permissions = {
    recommend: {
      can: ['Detect failures', 'Analyse transactions', 'Recommend recovery', 'Send approved notifications'],
      cant: ['Transfer arbitrary money', 'Change transaction amount', 'Issue unlimited refunds', 'Modify merchant configuration', 'Retry payments'],
    },
    assisted: {
      can: ['Detect failures', 'Analyse transactions', 'Recommend recovery', 'Send approved notifications', 'Retry payments (with approval)'],
      cant: ['Transfer arbitrary money', 'Change transaction amount', 'Issue unlimited refunds', 'Modify merchant configuration'],
    },
    autopilot: {
      can: ['Detect failures', 'Analyse transactions', 'Recommend recovery', 'Send approved notifications', 'Auto-retry eligible payments'],
      cant: ['Transfer arbitrary money', 'Change transaction amount', 'Issue unlimited refunds', 'Modify merchant configuration'],
    },
  };

  const perm = permissions[autopilotMode];

  return (
    <motion.div className="p-6 lg:p-8 max-w-[1000px] mx-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-emerald" /> Recovery Operations
        </h2>
        <p className="text-white/30 text-sm mt-1">Monitor and manage active recovery campaigns</p>
      </motion.div>

      {/* Campaign Card */}
      <motion.div variants={item} className="glass-hover p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Recovery Campaign: UPI Failure Incident</h3>
          <span className={clsx(
            'px-3 py-1 rounded-full text-[11px] font-semibold',
            status === 'Ready' && 'bg-accent/10 text-accent-light',
            status === 'Initializing' && 'bg-amber/10 text-amber',
            status === 'Running' && 'bg-emerald/10 text-emerald',
            status === 'Complete' && 'bg-emerald/10 text-emerald',
          )}>{status}</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent to-emerald"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Customers Contacted', value: recoveryData.customersContacted },
            { label: 'Payments Recovered', value: recoveryData.paymentsRecovered },
            { label: 'Revenue Recovered', value: formatCurrency(recoveryData.amountRecovered), highlight: true },
            { label: 'Recovery Rate', value: `${recoveryData.recoveryRate}%` },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] text-center">
              <p className={clsx(
                'text-2xl font-black font-mono mb-1',
                stat.highlight ? 'gradient-text-success' : 'text-white/80'
              )}>{stat.value}</p>
              <p className="text-[10px] text-white/25 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={launchRecovery}
          disabled={recoveryActive && status !== 'Ready'}
          className={clsx(
            'w-full py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
            status === 'Complete'
              ? 'bg-emerald text-white glow-success'
              : 'bg-emerald hover:bg-emerald-600 text-white glow-success hover:shadow-glow-lg',
            recoveryActive && status === 'Running' && 'opacity-70 cursor-not-allowed',
          )}
        >
          <Rocket className="w-5 h-5" />
          {status === 'Ready' ? 'Launch Recovery Campaign' : status === 'Complete' ? '✅ Recovery Complete' : `${status}...`}
        </button>
      </motion.div>

      {/* Autopilot Policy */}
      <motion.div variants={item} className="glass-hover p-6 mb-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-light" />
            <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Autopilot Policy</span>
          </div>
          <div className="flex gap-1.5 bg-white/[0.03] rounded-xl p-1">
            {AUTOPILOT_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => setAutopilotMode(mode.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                  autopilotMode === mode.id
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/30 hover:text-white/50'
                )}
              >
                {mode.emoji} {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* CAN */}
          <div>
            <h4 className="text-emerald text-[12px] font-bold mb-3 flex items-center gap-2">
              <Check className="w-3.5 h-3.5" /> Agent CAN:
            </h4>
            <div className="space-y-1.5">
              {perm.can.map((p, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald/[0.05] rounded-lg text-[12px] text-emerald/80"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Check className="w-3 h-3 flex-shrink-0" /> {p}
                </motion.div>
              ))}
            </div>
          </div>
          {/* CANNOT */}
          <div>
            <h4 className="text-rose text-[12px] font-bold mb-3 flex items-center gap-2">
              <X className="w-3.5 h-3.5" /> Agent CANNOT:
            </h4>
            <div className="space-y-1.5">
              {perm.cant.map((p, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-rose/[0.05] rounded-lg text-[12px] text-rose/70"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Lock className="w-3 h-3 flex-shrink-0" /> {p}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
