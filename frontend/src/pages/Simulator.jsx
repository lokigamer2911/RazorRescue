import { useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Play, Sparkles } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { formatCurrency } from '../utils/simulation';
import clsx from 'clsx';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function Simulator() {
  const { runIncident } = useAppState();
  const [simType, setSimType] = useState('upi-failure');
  const [severity, setSeverity] = useState('medium');
  const [volume, setVolume] = useState(10000);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [whatIfIncrease, setWhatIfIncrease] = useState(10);

  const runSimulation = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 1500));
    const incident = runIncident(simType, severity, volume);
    setResult(incident);
    setRunning(false);
  };

  const baseRate = 8.7;
  const projectedRate = baseRate + whatIfIncrease;
  const additionalRisk = Math.round(whatIfIncrease * 2340);

  return (
    <motion.div className="p-6 lg:p-8 max-w-[1200px] mx-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-accent-light" /> Incident Simulator
        </h2>
        <p className="text-white/30 text-sm mt-1">Generate realistic payment incidents to test the AI recovery engine</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Controls */}
        <motion.div variants={item} className="glass-hover p-6">
          <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Simulation Parameters</span>
          <div className="mt-5 space-y-5">
            <div>
              <label className="text-[12px] text-white/40 font-medium mb-2 block">Incident Type</label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-0 border border-white/[0.08] rounded-xl text-sm text-white outline-none focus:border-accent/50 transition-all appearance-none"
              >
                <option value="upi-failure">UPI Payment Failure Spike</option>
                <option value="checkout-abandon">Checkout Abandonment Wave</option>
                <option value="subscription-fail">Subscription Payment Failures</option>
                <option value="bank-outage">Bank Outage Scenario</option>
                <option value="combined">Combined Multi-Factor Incident</option>
              </select>
            </div>
            <div>
              <label className="text-[12px] text-white/40 font-medium mb-2 block">Severity</label>
              <div className="grid grid-cols-4 gap-2">
                {['low', 'medium', 'high', 'critical'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={clsx(
                      'py-2 rounded-xl text-[11px] font-medium capitalize transition-all border',
                      severity === s
                        ? 'bg-accent/15 border-accent/30 text-accent-light'
                        : 'border-white/[0.06] text-white/30 hover:bg-white/[0.03]'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] text-white/40 font-medium mb-2 block">
                Transaction Volume: <span className="text-white/70 font-mono">{volume.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={1000}
                max={50000}
                step={1000}
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
            <button
              onClick={runSimulation}
              disabled={running}
              className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-glow disabled:opacity-50"
            >
              {running ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><Play className="w-4 h-4" /> Generate Incident</>
              )}
            </button>
          </div>
        </motion.div>

        {/* What-If */}
        <motion.div variants={item} className="glass-hover p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-light" />
              <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">What-If Analysis</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent-light text-[11px] font-semibold">Predictive AI</span>
          </div>

          <div className="mb-5">
            <label className="text-[12px] text-white/40 mb-2 block">
              If failure rate increases by <span className="text-amber font-mono font-bold">+{whatIfIncrease}%</span>
            </label>
            <input
              type="range"
              min={5}
              max={50}
              value={whatIfIncrease}
              onChange={(e) => setWhatIfIncrease(parseInt(e.target.value))}
              className="w-full accent-amber"
            />
          </div>

          <div className="space-y-2 mb-5">
            {[
              { label: 'Current failure rate', value: `${baseRate}%`, color: '' },
              { label: 'Projected failure rate', value: `${projectedRate.toFixed(1)}%`, color: 'text-rose' },
              { label: 'Additional revenue risk', value: formatCurrency(additionalRisk), color: 'text-rose' },
              { label: 'Recommended intervention', value: whatIfIncrease > 15 ? 'Urgent recovery' : 'Activate recovery', color: '' },
              { label: 'Expected recovery', value: `${formatCurrency(additionalRisk * 0.64)} – ${formatCurrency(additionalRisk * 0.81)}`, color: 'text-emerald' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center px-3 py-2.5 bg-white/[0.02] rounded-lg">
                <span className="text-[12px] text-white/35">{row.label}</span>
                <span className={clsx('text-[12px] font-bold font-mono', row.color || 'text-white/60')}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-accent/[0.04] border border-accent/10 rounded-xl text-[12px] text-white/40 leading-relaxed">
            💡 <strong className="text-white/70">AI Prediction:</strong> Based on historical patterns, if the failure rate increases by {whatIfIncrease}%, an additional {formatCurrency(additionalRisk)} would be at risk. The AI recommends {whatIfIncrease > 15 ? 'urgently' : 'preemptively'} activating recovery.
          </div>
        </motion.div>
      </div>

      {/* Simulation Results */}
      {result && (
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="glass-hover p-6 mt-5 border-gradient"
        >
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">📊 Simulation Results</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald/10 text-emerald text-[11px] font-semibold">Complete</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Type', value: result.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) },
              { label: 'Severity', value: result.severity.toUpperCase(), color: result.severity === 'critical' || result.severity === 'high' ? 'text-rose' : '' },
              { label: 'Affected', value: result.affectedTransactions.toLocaleString() },
              { label: 'Revenue at Risk', value: formatCurrency(result.revenueAtRisk), color: 'text-rose' },
              { label: 'AI Confidence', value: `${result.aiConfidence}%`, color: 'text-emerald' },
              { label: 'Expected Recovery', value: `${formatCurrency(result.expectedRecovery.low)} – ${formatCurrency(result.expectedRecovery.high)}`, color: 'text-emerald' },
            ].map((stat, i) => (
              <div key={i} className={clsx("bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]", i >= 4 && 'lg:col-span-2')}>
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={clsx('font-bold font-mono text-sm', stat.color || 'text-white/80')}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Root Cause</p>
              <p className="text-[13px] text-white/50 leading-relaxed">{result.rootCause}</p>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">AI Recommendation</p>
              <p className="text-[13px] text-white/50 leading-relaxed">{result.recoveryStrategy}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
