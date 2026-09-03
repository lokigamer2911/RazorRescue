import { useState, useRef, useEffect } from 'react';
import { Flask, Play, Sparkle } from '@phosphor-icons/react';
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
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const c = animate(ref.current.querySelectorAll('.rc'), { opacity: [0, 1], translateY: [20, 0], duration: 600, delay: stagger(60, { start: 80 }), ease: 'outExpo' });
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
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto bg-gray-50/50 min-h-full" ref={ref}>
      <h2 className="text-[22px] font-bold tracking-tight text-gray-900 mb-1 rc" style={{ opacity: 0 }}>
        <Flask weight="fill" className="w-5 h-5 text-blue-600 inline mr-2 -mt-1" /> Incident Simulator
      </h2>
      <p className="text-[13px] text-gray-400 mb-6 rc" style={{ opacity: 0 }}>Generate incidents to test the AI recovery engine</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-clean p-6 rc" style={{ opacity: 0 }}>
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Parameters</span>
          <div className="mt-5 space-y-5">
            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block">Type</label>
              <select value={simType} onChange={e => setSimType(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[12.5px] text-gray-700 outline-none focus:border-blue-400 transition-all">
                <option value="upi-failure">UPI Payment Failure</option>
                <option value="checkout-abandon">Checkout Abandonment</option>
                <option value="subscription-fail">Subscription Failures</option>
                <option value="bank-outage">Bank Outage</option>
                <option value="combined">Combined Incident</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-2 block">Severity</label>
              <div className="grid grid-cols-4 gap-2">
                {['low', 'medium', 'high', 'critical'].map(s => (
                  <button key={s} onClick={() => setSeverity(s)}
                    className={clsx('py-2 rounded-xl text-[11px] font-medium capitalize transition-all border', severity === s ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block">Volume: <span className="text-gray-700 font-mono">{volume.toLocaleString()}</span></label>
              <input type="range" min={1000} max={50000} step={1000} value={volume} onChange={e => setVolume(+e.target.value)} className="w-full accent-blue-600" />
            </div>
            <button onClick={run} disabled={running} className="w-full py-3.5 btn-primary flex items-center justify-center gap-2 text-[13px] disabled:opacity-50">
              {running ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" /> Analyzing...</> : <><Play weight="fill" className="w-4 h-4" /> Generate Incident</>}
            </button>
          </div>
        </div>

        <div className="card-clean p-6 rc" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkle weight="fill" className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">What-If Analysis</span>
            </div>
            <span className="badge-sm badge-blue">Predictive</span>
          </div>
          <div className="mb-5">
            <label className="text-[11px] text-gray-500 mb-1.5 block">Increase by <span className="text-amber-600 font-mono font-bold">+{whatIf}%</span></label>
            <input type="range" min={5} max={50} value={whatIf} onChange={e => setWhatIf(+e.target.value)} className="w-full accent-amber-500" />
          </div>
          <div className="space-y-2 mb-5">
            {[
              { k: 'Current rate', v: `${base}%` },
              { k: 'Projected', v: `${proj.toFixed(1)}%`, c: 'text-red-500' },
              { k: 'Additional risk', v: formatCurrency(risk), c: 'text-red-500' },
              { k: 'Intervention', v: whatIf > 15 ? 'Urgent recovery' : 'Activate recovery' },
              { k: 'Expected recovery', v: `${formatCurrency(risk * 0.64)} – ${formatCurrency(risk * 0.81)}`, c: 'text-emerald-600' },
            ].map((r, i) => (
              <div key={i} className="flex justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-[11px] text-gray-500">{r.k}</span>
                <span className={clsx('text-[11px] font-mono font-bold', r.c || 'text-gray-600')}>{r.v}</span>
              </div>
            ))}
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-[11.5px] text-gray-600 leading-relaxed">
            💡 <strong className="text-gray-800">AI Prediction:</strong> If failure rate increases by {whatIf}%, an additional {formatCurrency(risk)} would be at risk.
          </div>
        </div>
      </div>

      {result && (
        <div className="card-clean p-6 mt-5 rc" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">📊 Results</span>
            <span className="badge-sm badge-emerald">Complete</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { l: 'Type', v: result.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) },
              { l: 'Severity', v: result.severity.toUpperCase(), c: (result.severity === 'critical' || result.severity === 'high') ? 'text-red-500' : '' },
              { l: 'Affected', v: result.affectedTransactions.toLocaleString() },
              { l: 'Revenue at Risk', v: formatCurrency(result.revenueAtRisk), c: 'text-red-500' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{s.l}</p>
                <p className={clsx('font-mono font-bold text-[13px]', s.c || 'text-gray-700')}>{s.v}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">Root Cause</p>
              <p className="text-[12px] text-gray-600 leading-relaxed">{result.rootCause}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-2">Recommendation</p>
              <p className="text-[12px] text-gray-600 leading-relaxed">{result.recoveryStrategy}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
