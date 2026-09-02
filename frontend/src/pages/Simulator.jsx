import { useState, useRef, useEffect } from 'react';
import { FlaskConical, Play, Sparkles } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { formatCurrency } from '../utils/simulation';
import { animate, stagger } from 'animejs';
import clsx from 'clsx';

export default function Simulator() {
  const { runIncident } = useAppState();
  const [simType, setSimType] = useState('upi-failure');
  const [severity, setSeverity] = useState('medium');
  const [volume, setVolume] = useState(10000);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [whatIf, setWhatIf] = useState(10);
  const cardsRef = useRef(null);

  useEffect(() => {
    if (!cardsRef.current) return;
    const cards = cardsRef.current.querySelectorAll('.reveal-card');
    const c = animate(cards, { opacity: [0, 1], translateY: [24, 0], duration: 700, delay: stagger(70, { start: 100 }), ease: 'outExpo' });
    return () => c.pause();
  }, []);

  const run = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 1500));
    setResult(runIncident(simType, severity, volume));
    setRunning(false);
  };

  const base = 8.7;
  const proj = base + whatIf;
  const risk = Math.round(whatIf * 2340);

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto" ref={cardsRef}>
      <h2 className="text-[22px] font-bold tracking-tight text-white/90 mb-1 reveal-card" style={{ opacity: 0 }}>
        <FlaskConical className="w-5 h-5 text-cyan-400 inline mr-2 -mt-1" /> Incident Simulator
      </h2>
      <p className="text-[13px] text-white/25 mb-6 reveal-card" style={{ opacity: 0 }}>Generate incidents to test the AI recovery engine</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Controls */}
        <div className="card-glass p-6 reveal-card noise" style={{ opacity: 0 }}>
          <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Parameters</span>
          <div className="mt-5 space-y-5">
            <div>
              <label className="text-[11px] text-white/30 mb-1.5 block">Type</label>
              <select value={simType} onChange={e => setSimType(e.target.value)}
                className="w-full px-4 py-2.5 bg-navy-800 border border-white/[0.06] rounded-xl text-[12.5px] text-white/80 outline-none focus:border-cyan/40 transition-all appearance-none">
                <option value="upi-failure">UPI Payment Failure</option>
                <option value="checkout-abandon">Checkout Abandonment</option>
                <option value="subscription-fail">Subscription Failures</option>
                <option value="bank-outage">Bank Outage</option>
                <option value="combined">Combined Incident</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-white/30 mb-2 block">Severity</label>
              <div className="grid grid-cols-4 gap-2">
                {['low', 'medium', 'high', 'critical'].map(s => (
                  <button key={s} onClick={() => setSeverity(s)}
                    className={clsx('py-2 rounded-xl text-[11px] font-medium capitalize transition-all border', severity === s ? 'bg-cyan/10 border-cyan/25 text-cyan-400' : 'border-white/[0.05] text-white/25 hover:bg-white/[0.02]')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-white/30 mb-1.5 block">Volume: <span className="text-white/60 font-mono">{volume.toLocaleString()}</span></label>
              <input type="range" min={1000} max={50000} step={1000} value={volume} onChange={e => setVolume(+e.target.value)} className="w-full accent-cyan" />
            </div>
            <button onClick={run} disabled={running} className="w-full py-3.5 btn-glow flex items-center justify-center gap-2 text-[13px] disabled:opacity-50">
              {running ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</> : <><Play className="w-4 h-4" /> Generate Incident</>}
            </button>
          </div>
        </div>

        {/* What-If */}
        <div className="card-glass p-6 reveal-card noise" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">What-If Analysis</span>
            </div>
            <span className="badge badge-cyan">Predictive</span>
          </div>
          <div className="mb-5">
            <label className="text-[11px] text-white/30 mb-1.5 block">Increase by <span className="text-amber font-mono font-bold">+{whatIf}%</span></label>
            <input type="range" min={5} max={50} value={whatIf} onChange={e => setWhatIf(+e.target.value)} className="w-full accent-amber" />
          </div>
          <div className="space-y-2 mb-5">
            {[
              { k: 'Current rate', v: `${base}%` },
              { k: 'Projected', v: `${proj.toFixed(1)}%`, color: 'text-rose' },
              { k: 'Additional risk', v: formatCurrency(risk), color: 'text-rose' },
              { k: 'Intervention', v: whatIf > 15 ? 'Urgent recovery' : 'Activate recovery' },
              { k: 'Expected recovery', v: `${formatCurrency(risk * 0.64)} – ${formatCurrency(risk * 0.81)}`, color: 'text-emerald' },
            ].map((r, i) => (
              <div key={i} className="flex justify-between px-3 py-2 bg-white/[0.02] rounded-lg">
                <span className="text-[11px] text-white/30">{r.k}</span>
                <span className={clsx('text-[11px] font-mono font-bold', r.color || 'text-white/50')}>{r.v}</span>
              </div>
            ))}
          </div>
          <div className="p-4 bg-cyan/[0.03] border border-cyan/8 rounded-xl text-[11.5px] text-white/35 leading-relaxed">
            💡 <strong className="text-white/60">AI Prediction:</strong> If failure rate increases by {whatIf}%, an additional {formatCurrency(risk)} would be at risk.
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="card-glass p-6 mt-5 reveal-card noise relative overflow-hidden" style={{ opacity: 0 }}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan/[0.03] rounded-full blur-[60px]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">📊 Results</span>
              <span className="badge badge-emerald">Complete</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[
                { l: 'Type', v: result.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) },
                { l: 'Severity', v: result.severity.toUpperCase(), c: (result.severity === 'critical' || result.severity === 'high') ? 'text-rose' : '' },
                { l: 'Affected', v: result.affectedTransactions.toLocaleString() },
                { l: 'Revenue at Risk', v: formatCurrency(result.revenueAtRisk), c: 'text-rose' },
              ].map((s, i) => (
                <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.03]">
                  <p className="text-[9px] text-white/20 uppercase tracking-[0.1em] mb-1">{s.l}</p>
                  <p className={clsx('font-mono font-bold text-[13px]', s.c || 'text-white/70')}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.03]">
                <p className="text-[9px] text-white/20 uppercase tracking-[0.1em] mb-2">Root Cause</p>
                <p className="text-[12px] text-white/40 leading-relaxed">{result.rootCause}</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.03]">
                <p className="text-[9px] text-white/20 uppercase tracking-[0.1em] mb-2">Recommendation</p>
                <p className="text-[12px] text-white/40 leading-relaxed">{result.recoveryStrategy}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
