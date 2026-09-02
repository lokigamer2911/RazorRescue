import { useEffect, useRef } from 'react';
import { Search, Shield, Zap } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { formatCurrency } from '../utils/simulation';
import { animate, stagger } from 'animejs';
import clsx from 'clsx';

export default function Investigation() {
  const { analysis } = useAppState();
  const cardsRef = useRef(null);
  const topBanks = (analysis?.byBank || []).slice(0, 4);
  const topFailed = (analysis?.topFailed || []).slice(0, 8);

  useEffect(() => {
    if (!cardsRef.current) return;
    const cards = cardsRef.current.querySelectorAll('.reveal-card');
    const controls = animate(cards, {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 700,
      delay: stagger(70, { start: 100 }),
      ease: 'outExpo',
    });
    return () => controls.pause();
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto" ref={cardsRef}>
      {/* Ambient */}
      <div className="ambient-orb top-[-5%] left-[30%] w-[400px] h-[400px] bg-cyan/[0.04]" />

      <div className="relative z-10">
        <h2 className="text-[22px] font-bold tracking-tight text-white/90 mb-1 reveal-card" style={{ opacity: 0 }}>
          <Search className="w-5 h-5 text-cyan-400 inline mr-2 -mt-1" /> AI Investigation
        </h2>
        <p className="text-[13px] text-white/25 mb-6 reveal-card" style={{ opacity: 0 }}>Deep analysis of the UPI payment failure incident</p>

        {/* Incident Summary */}
        <div className="card-glass p-6 mb-5 reveal-card noise" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Incident Summary</span>
            <span className="badge badge-rose">ACTIVE</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Event', val: 'UPI +38%' },
              { label: 'Window', val: '18:00 — 21:00' },
              { label: 'Affected', val: '428 txns', accent: true },
              { label: 'Revenue Loss', val: formatCurrency(62400), rose: true },
              { label: 'Confidence', val: '91%', emerald: true },
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.03]">
                <p className="text-[9px] text-white/20 uppercase tracking-[0.1em] mb-1">{s.label}</p>
                <p className={clsx('font-mono font-bold text-[15px]', s.rose && 'text-rose', s.emerald && 'text-emerald', !s.rose && !s.emerald && 'text-white/75')}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Root Cause */}
        <div className="card-glass p-6 mb-5 reveal-card noise" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Root Cause Analysis</span>
            <span className="badge badge-cyan">AI Generated</span>
          </div>
          <p className="text-[13px] text-white/40 leading-relaxed mb-6">
            Revenue dropped because UPI failures increased from <span className="text-white/85 font-semibold">4.2%</span> to{' '}
            <span className="text-white/85 font-semibold">13.7%</span> between 18:00 and 21:00.{' '}
            <span className="text-white/85 font-semibold">71%</span> of affected transactions were from three banks.
          </p>

          <div className="space-y-3 mb-6">
            {topBanks.map((bank, i) => {
              const rate = bank.total > 0 ? (bank.failed / bank.total * 100) : 0;
              const isHigh = rate > 10;
              return (
                <div key={bank.code} className="flex items-center gap-4">
                  <span className="text-[12px] text-white/35 w-[110px] flex-shrink-0">{bank.name}</span>
                  <div className="flex-1 h-7 bg-white/[0.02] rounded-lg overflow-hidden">
                    <div
                      className={clsx('h-full rounded-lg flex items-center justify-end px-3 text-[10px] font-mono font-bold text-white transition-all', isHigh ? 'bg-gradient-to-r from-rose to-amber' : 'bg-gradient-to-r from-emerald/50 to-emerald/30')}
                      style={{ width: `${Math.min(100, rate * 5)}%` }}
                    >
                      {rate.toFixed(1)}%
                    </div>
                  </div>
                  <span className={clsx('badge', rate > 15 ? 'badge-rose' : rate > 10 ? 'badge-amber' : 'badge-emerald')}>
                    {rate > 15 ? 'CRITICAL' : rate > 10 ? 'HIGH' : 'OK'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="bg-cyan/[0.03] border border-cyan/8 border-l-[3px] border-l-cyan rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[12px] text-cyan-400 font-semibold">AI Agent Explanation</span>
            </div>
            <p className="text-[12.5px] text-white/35 leading-relaxed">
              The spike correlates with a known NPCI routing issue affecting Bank of Baroda, Union Bank, and Indian Bank UPI endpoints. These three banks account for 71% of all failed transactions. <span className="text-emerald font-semibold">Confidence: 91%</span>
            </p>
          </div>
        </div>

        {/* Customers */}
        <div className="card-glass p-6 mb-5 reveal-card noise" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Affected Customers</span>
            <span className="badge badge-amber">428 customers</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['Customer', 'Amount', 'Bank', 'Status'].map(h => (
                    <th key={h} className="pb-2.5 text-[9px] text-white/20 uppercase tracking-[0.1em] font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topFailed.map((txn, i) => (
                  <tr key={txn.id} className="border-b border-white/[0.02] hover:bg-white/[0.015] transition-colors">
                    <td className="py-2.5 text-[12px] text-white/60">{txn.customer}</td>
                    <td className="py-2.5 text-[12px] font-mono font-semibold text-white/70">{formatCurrency(txn.amount)}</td>
                    <td className="py-2.5 text-[12px] text-white/40">{txn.bankCode}</td>
                    <td className="py-2.5 text-[11px] text-rose/60">{txn.failureReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Plan */}
        <div className="card-glass p-6 reveal-card noise relative overflow-hidden" style={{ opacity: 0 }}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald/[0.03] rounded-full blur-[60px]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">💡 What Should We Do?</span>
              <span className="badge badge-cyan">AI Recommended</span>
            </div>
            <h3 className="text-[16px] font-bold text-white/85 mb-2">Send recovery links with alternate payment methods</h3>
            <p className="text-[12.5px] text-white/35 mb-5">Resend payment requests to 312 eligible customers with Net Banking / Card alternatives.</p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Expected Recovery', val: '₹41.8K – ₹49.2K', color: 'text-emerald' },
                { label: 'Risk Level', val: 'LOW', color: 'text-emerald' },
                { label: 'Required', val: 'Customer approval', color: 'text-white/55' },
              ].map((m, i) => (
                <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.03]">
                  <p className="text-[9px] text-white/20 uppercase tracking-[0.1em] mb-1">{m.label}</p>
                  <p className={clsx('font-mono font-bold text-[13px]', m.color)}>{m.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {['No amount changes', 'No auto refunds', 'Customer must approve', 'Full audit trail'].map((r, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald/[0.04] rounded-lg text-[11px] text-emerald/60">
                  <Shield className="w-3 h-3 flex-shrink-0" /> {r}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-3 btn-glow flex items-center justify-center gap-2 text-[13px]">💰 Execute Recovery</button>
              <button className="flex-1 py-3 border border-white/[0.08] rounded-xl text-white/40 text-[13px] font-medium hover:bg-white/[0.02] transition-all">🔮 What-If</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
