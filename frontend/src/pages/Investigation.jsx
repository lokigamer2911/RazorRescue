import { motion } from 'framer-motion';
import { Search, AlertTriangle, Shield, ArrowRight, Zap } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { formatCurrency } from '../utils/simulation';
import clsx from 'clsx';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function Investigation() {
  const { analysis } = useAppState();
  const topBanks = (analysis?.byBank || []).slice(0, 4);
  const topFailed = (analysis?.topFailed || []).slice(0, 8);

  return (
    <motion.div className="p-6 lg:p-8 max-w-[1200px] mx-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Search className="w-6 h-6 text-accent-light" /> AI Investigation
        </h2>
        <p className="text-white/30 text-sm mt-1">Deep analysis of the UPI payment failure incident</p>
      </motion.div>

      {/* Incident Summary */}
      <motion.div variants={item} className="glass-hover p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Incident Summary</span>
          <span className="px-2.5 py-1 rounded-full bg-rose/10 text-rose text-[11px] font-semibold">ACTIVE</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Event', value: 'UPI failures +38%', highlight: false },
            { label: 'Window', value: '18:00 — 21:00', highlight: false },
            { label: 'Affected', value: '428 txns', highlight: true },
            { label: 'Revenue Loss', value: formatCurrency(62400), highlight: true, danger: true },
            { label: 'AI Confidence', value: '91%', highlight: true, success: true },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={clsx(
                'font-bold font-mono',
                stat.highlight && 'text-lg',
                stat.danger && 'text-rose',
                stat.success && 'text-emerald',
                !stat.danger && !stat.success && 'text-white/80'
              )}>{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Root Cause */}
      <motion.div variants={item} className="glass-hover p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Root Cause Analysis</span>
          <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent-light text-[11px] font-semibold">AI Generated</span>
        </div>
        <p className="text-white/50 text-sm leading-relaxed mb-6">
          Revenue dropped because UPI failures increased from <span className="text-white/90 font-semibold">4.2%</span> to{' '}
          <span className="text-white/90 font-semibold">13.7%</span> between 18:00 and 21:00.{' '}
          <span className="text-white/90 font-semibold">71%</span> of affected transactions were from three banks.
        </p>

        {/* Bank Bars */}
        <div className="space-y-3 mb-6">
          {topBanks.map((bank, i) => {
            const rate = bank.total > 0 ? (bank.failed / bank.total * 100) : 0;
            const isHigh = rate > 10;
            return (
              <motion.div
                key={bank.code}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <span className="text-[12px] text-white/40 w-[120px] flex-shrink-0">{bank.name}</span>
                <div className="flex-1 h-7 bg-white/[0.03] rounded-lg overflow-hidden">
                  <motion.div
                    className={clsx(
                      'h-full rounded-lg flex items-center justify-end px-3 text-[11px] font-bold font-mono text-white',
                      isHigh ? 'bg-gradient-to-r from-rose to-amber' : 'bg-gradient-to-r from-emerald/60 to-emerald/40'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, rate * 5)}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                  >
                    {rate.toFixed(1)}%
                  </motion.div>
                </div>
                <span className={clsx(
                  'px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider',
                  rate > 15 ? 'bg-rose/15 text-rose' : rate > 10 ? 'bg-amber/15 text-amber' : 'bg-emerald/15 text-emerald'
                )}>
                  {rate > 15 ? 'CRITICAL' : rate > 10 ? 'HIGH' : 'NORMAL'}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* AI Explanation */}
        <div className="bg-accent/[0.04] border border-accent/10 border-l-[3px] border-l-accent rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-accent-light" />
            <span className="text-[12px] text-accent-light font-semibold">AI Agent Explanation</span>
          </div>
          <p className="text-white/40 text-[13px] leading-relaxed">
            The spike correlates with a known NPCI routing issue affecting Bank of Baroda, Union Bank, and Indian Bank UPI endpoints between 17:30 and 22:00. These three banks account for 71% of all failed transactions. The remaining 29% is within normal variance. <span className="text-emerald font-semibold">Confidence: 91%</span>
          </p>
        </div>
      </motion.div>

      {/* Affected Customers */}
      <motion.div variants={item} className="glass-hover p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Affected Customers</span>
          <span className="px-2.5 py-1 rounded-full bg-amber/10 text-amber text-[11px] font-semibold">428 customers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-3 text-[10px] text-white/25 uppercase tracking-wider font-medium">Customer</th>
                <th className="pb-3 text-[10px] text-white/25 uppercase tracking-wider font-medium">Amount</th>
                <th className="pb-3 text-[10px] text-white/25 uppercase tracking-wider font-medium">Bank</th>
                <th className="pb-3 text-[10px] text-white/25 uppercase tracking-wider font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {topFailed.map((txn, i) => (
                <motion.tr
                  key={txn.id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                >
                  <td className="py-3 text-[13px] text-white/70">{txn.customer}</td>
                  <td className="py-3 text-[13px] font-mono font-semibold text-white/80">{formatCurrency(txn.amount)}</td>
                  <td className="py-3 text-[13px] text-white/50">{txn.bankCode}</td>
                  <td className="py-3 text-[12px] text-rose/70">{txn.failureReason}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Action Plan */}
      <motion.div variants={item} className="glass-hover p-6 border-gradient">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">💡 What Should We Do?</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent-light text-[11px] font-semibold">AI Recommended</span>
        </div>
        <h3 className="text-lg font-bold text-white/90 mb-2">Send recovery links with alternate payment methods</h3>
        <p className="text-white/40 text-sm mb-5">Resend payment requests to 312 eligible customers. Suggest Net Banking / Card as alternatives to UPI for affected banks.</p>
        
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Expected Recovery', value: '₹41,800 – ₹49,200', color: 'text-emerald' },
            { label: 'Risk Level', value: 'LOW', color: 'text-emerald' },
            { label: 'Actions Required', value: 'Customer approval needed', color: 'text-white/60' },
          ].map((m, i) => (
            <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{m.label}</p>
              <p className={clsx('font-bold font-mono text-sm', m.color)}>{m.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {['No payment amount changes required', 'No automatic refunds', 'Customer must approve payment', 'Full audit trail logged'].map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald/[0.05] rounded-lg text-[12px] text-emerald/70">
              <Shield className="w-3 h-3 flex-shrink-0" /> {r}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-3 px-5 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-glow">
            💰 Execute Recovery Plan
          </button>
          <button className="flex-1 py-3 px-5 rounded-xl border border-white/[0.1] text-white/50 text-sm font-medium hover:bg-white/[0.03] transition-all">
            🔮 What-If Simulation
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
