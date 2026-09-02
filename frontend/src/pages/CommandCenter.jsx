import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Brain, Zap, ArrowRight, Activity } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useAppState } from '../hooks/useAppState';
import { formatCurrency } from '../utils/simulation';
import clsx from 'clsx';

// Animated counter hook
function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);
  return value;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// Hourly chart data
const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  failures: i >= 18 && i <= 21 ? Math.round(40 + Math.random() * 60) : Math.round(5 + Math.random() * 15),
  success: i >= 18 && i <= 21 ? Math.round(200 + Math.random() * 100) : Math.round(300 + Math.random() * 200),
}));

export default function CommandCenter() {
  const { analysis, setView } = useAppState();
  const revenueAtRisk = useCountUp(147230, 1200);
  const recovered = useCountUp(0, 800);

  const navigateTo = (view) => {
    // This will be passed through context or we can use the App's setView
    window.__razorrescue_navigate?.(view);
  };

  const breakdownItems = [
    { icon: '🔴', name: 'Payment Failures', desc: '↑ 38% in last 2 hours', amount: 62000, pct: 42, color: '#f43f5e' },
    { icon: '🟠', name: 'Checkout Abandonment', desc: '↑ 21% increase detected', amount: 41000, pct: 28, color: '#f59e0b' },
    { icon: '🟡', name: 'Failed Subscriptions', desc: '₹27,400 revenue at risk', amount: 27000, pct: 18, color: '#eab308' },
    { icon: '🟣', name: 'High-Risk Customers', desc: 'Churn probability > 70%', amount: 17000, pct: 12, color: '#8b5cf6' },
  ];

  const detections = [
    { severity: 'critical', title: 'UPI failure spike detected', detail: '38% increase in last 2 hours', time: '2 min ago' },
    { severity: 'warning', title: 'Checkout abandonment rising', detail: '21% increase — MEDIUM priority', time: '8 min ago' },
    { severity: 'info', title: 'Subscription failures detected', detail: '₹27,400 revenue at risk', time: '15 min ago' },
  ];

  const agentSteps = [
    { text: 'Detected abnormal payment failure rate', done: true },
    { text: 'Compared against 7-day baseline', done: true },
    { text: 'Identified UPI as primary failure category', done: true },
    { text: 'Segmented 428 affected transactions', done: true },
    { text: 'Calculated ₹62,400 revenue at risk', done: true },
    { text: 'Checked available recovery actions', done: true },
    { text: 'Evaluating recovery strategies...', done: false, active: true },
  ];

  return (
    <motion.div
      className="p-6 lg:p-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Top Hero Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Revenue at Risk */}
        <motion.div variants={item} className="glass-hover p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose/[0.05] rounded-full blur-[60px] group-hover:bg-rose/[0.1] transition-colors" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Revenue at Risk</span>
              <span className="px-2.5 py-1 rounded-full bg-rose/10 text-rose text-[11px] font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 18.4%
              </span>
            </div>
            <div className="text-[42px] font-black tracking-tighter font-mono leading-none mb-2 gradient-text-danger">
              {formatCurrency(revenueAtRisk)}
            </div>
            <p className="text-white/25 text-xs mb-4">Across 10,000 transactions analysed</p>
            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-rose to-amber"
                initial={{ width: 0 }}
                animate={{ width: '62%' }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
              />
            </div>
            <p className="text-white/20 text-[11px] mt-2">14.7% of potential revenue</p>
          </div>
        </motion.div>

        {/* Recovered */}
        <motion.div variants={item} className="glass-hover p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/[0.05] rounded-full blur-[60px] group-hover:bg-emerald/[0.1] transition-colors" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Recovered This Month</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald/10 text-emerald text-[11px] font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 31.2%
              </span>
            </div>
            <div className="text-[42px] font-black tracking-tighter font-mono leading-none mb-2 gradient-text-success">
              {formatCurrency(recovered)}
            </div>
            <p className="text-white/25 text-xs mb-4">Recovery rate: 0%</p>
            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald to-cyan-400 w-0" />
            </div>
            <p className="text-white/20 text-[11px] mt-2">AI recovery engine ready</p>
          </div>
        </motion.div>
      </div>

      {/* Risk Breakdown */}
      <motion.div variants={item} className="glass-hover p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Revenue Risk Breakdown</span>
          <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent-light text-[11px] font-semibold">AI Analysed</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {breakdownItems.map((item, i) => (
            <motion.div
              key={i}
              className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.1] transition-all group cursor-pointer"
              whileHover={{ y: -2, scale: 1.01 }}
            >
              <div className="text-xl mb-2">{item.icon}</div>
              <p className="text-[13px] font-semibold text-white/80 mb-0.5">{item.name}</p>
              <p className="text-[11px] text-white/30 mb-3">{item.desc}</p>
              <p className="text-lg font-bold font-mono mb-2" style={{ color: item.color }}>
                {formatCurrency(item.amount)}
              </p>
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: item.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* AI Detections */}
        <motion.div variants={item} className="glass-hover p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">AI Detections</span>
            <span className="px-2 py-0.5 rounded-full bg-rose/10 text-rose text-[10px] font-bold animate-pulse">LIVE</span>
          </div>
          <div className="space-y-3">
            {detections.map((d, i) => (
              <motion.div
                key={i}
                className="flex gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
              >
                <div className={clsx(
                  'w-1 rounded-full flex-shrink-0',
                  d.severity === 'critical' && 'bg-rose',
                  d.severity === 'warning' && 'bg-amber',
                  d.severity === 'info' && 'bg-accent',
                )} />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-white/80 mb-0.5">{d.title}</p>
                  <p className="text-[11px] text-white/30">{d.detail}</p>
                  <p className="text-[10px] text-white/15 mt-1">{d.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Recommendation */}
        <motion.div variants={item} className="lg:col-span-2 glass-hover p-6 border-gradient relative">
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-accent-light" />
                <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">AI Recommendation</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent-light text-[11px] font-semibold">91% confidence</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-5">
              "I found <span className="text-white/90 font-semibold">428 customers</span> affected by the UPI failure spike.{' '}
              <span className="text-white/90 font-semibold">{formatCurrency(62400)}</span> is potentially recoverable through payment link resends with alternate method suggestions."
            </p>
            <div className="flex items-center gap-3 p-3 bg-emerald/[0.06] border border-emerald/10 rounded-xl mb-5">
              <Shield className="w-4 h-4 text-emerald flex-shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-white/40">Risk Level:</span>
                <span className="px-2 py-0.5 bg-emerald text-white text-[10px] font-bold rounded">LOW</span>
                <span className="text-[11px] text-white/30">No payment amount changes. Customer must approve.</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 py-3 px-5 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-glow hover:shadow-glow-lg">
                <Search className="w-4 h-4" /> Investigate
              </button>
              <button className="flex-1 py-3 px-5 rounded-xl bg-emerald hover:bg-emerald-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 glow-success">
                <DollarSign className="w-4 h-4" /> Recover {formatCurrency(62400)}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Agent Reasoning */}
        <motion.div variants={item} className="glass-hover p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-violet" />
              <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">AI Agent Reasoning</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-violet/10 text-violet text-[11px] font-semibold">Analyzing</span>
          </div>
          <div className="space-y-2">
            {agentSteps.map((step, i) => (
              <motion.div
                key={i}
                className={clsx(
                  'flex items-center gap-3 py-1.5 text-[12px]',
                  step.done ? 'text-white/40' : step.active ? 'text-accent-light font-medium' : 'text-white/20'
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.12 }}
              >
                {step.done ? (
                  <div className="w-5 h-5 rounded-full bg-emerald/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-emerald font-bold">✓</span>
                  </div>
                ) : step.active ? (
                  <div className="w-5 h-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0" />
                )}
                <span>{step.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Failure Rate Chart */}
        <motion.div variants={item} className="glass-hover p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-light" />
              <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Failure Rate by Hour</span>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)' }}
                  axisLine={false}
                  tickLine={false}
                  interval={3}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(12,13,18,0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                    backdropFilter: 'blur(20px)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="failures"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="url(#failGrad)"
                  dot={false}
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Revenue Risk Radar */}
      <motion.div variants={item} className="glass-hover p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Revenue Risk Radar</span>
        </div>
        <div className="flex items-center gap-8 flex-wrap justify-center">
          {/* Center */}
          <div className="w-32 h-32 rounded-full bg-rose/[0.06] border-2 border-rose/20 flex flex-col items-center justify-center">
            <span className="text-xl font-black font-mono text-rose">{formatCurrency(147230)}</span>
            <span className="text-[9px] text-rose/60 uppercase tracking-widest font-semibold">AT RISK</span>
          </div>
          {/* Branches */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-w-[300px]">
            {[
              { amount: '₹62K', label: 'Payment\nFailure', action: 'RECOVER', color: 'text-rose', bg: 'bg-rose/[0.06]' },
              { amount: '₹41K', label: 'Checkout\nAbandonment', action: 'RECOVER', color: 'text-amber', bg: 'bg-amber/[0.06]' },
              { amount: '₹27K', label: 'Subscription\nFailure', action: 'RETRY', color: 'text-amber', bg: 'bg-amber/[0.06]' },
              { amount: '₹17K', label: 'High-Risk\nCustomers', action: 'ENGAGE', color: 'text-violet', bg: 'bg-violet/[0.06]' },
            ].map((branch, i) => (
              <motion.div
                key={i}
                className={clsx('text-center p-4 rounded-xl border border-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer', branch.bg)}
                whileHover={{ y: -3, scale: 1.02 }}
              >
                <div className={clsx('text-xl font-black font-mono mb-1', branch.color)}>{branch.amount}</div>
                <div className="text-[11px] text-white/30 whitespace-pre-line mb-2 leading-tight">{branch.label}</div>
                <div className="text-[9px] text-white/20 uppercase tracking-wider font-semibold">→ {branch.action}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Lazy imports for inline use
import { Search, DollarSign } from 'lucide-react';
