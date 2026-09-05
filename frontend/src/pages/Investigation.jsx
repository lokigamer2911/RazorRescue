import { useEffect, useMemo, useRef } from 'react';
import { MagnifyingGlass, Shield, Lightning, Warning, Info } from '@phosphor-icons/react';
import { useAppState } from '../hooks/useAppState';
import { formatCurrency } from '../utils/simulation';
import { deriveExceptionList } from '../utils/insights';
import { animate, stagger } from 'animejs';
import clsx from 'clsx';

export default function Investigation() {
  const { analysis, insights } = useAppState();
  const ref = useRef(null);
  const topBanks = (analysis?.byBank || []).slice(0, 4);
  const topFailed = (analysis?.topFailed || []).slice(0, 8);
  const totalFailed = analysis?.failed || 0;
  const totalTxns = analysis?.total || 1;
  const exceptions = useMemo(() => deriveExceptionList(analysis, insights), [analysis, insights]);

  useEffect(() => {
    if (!ref.current) return;
    const c = animate(ref.current.querySelectorAll('.rc'), { opacity: [0, 1], translateY: [20, 0], duration: 600, delay: stagger(60, { start: 80 }), ease: 'outExpo' });
    return () => c.pause();
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto bg-gray-50/50 min-h-full" ref={ref}>
      <h2 className="text-[22px] font-bold tracking-tight text-gray-900 mb-1 rc" style={{ opacity: 0 }}>
        <MagnifyingGlass weight="fill" className="w-5 h-5 text-blue-600 inline mr-2 -mt-1" /> AI Investigation
      </h2>
      <p className="text-[13px] text-gray-400 mb-6 rc" style={{ opacity: 0 }}>Deep analysis of payment failure incident</p>

      {/* Summary */}
      <div className="card-clean p-6 mb-5 rc" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Incident Summary</span>
          <span className="badge-sm badge-rose">ACTIVE</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { l: 'Total Transactions', v: totalTxns.toLocaleString() },
            { l: 'Failed', v: totalFailed.toLocaleString(), c: 'text-red-500' },
            { l: 'Success Rate', v: `${analysis?.successRate || 100}%`, c: 'text-emerald-600' },
            { l: 'Revenue at Risk', v: formatCurrency(analysis?.revenueAtRisk || 0), c: 'text-red-500' },
            { l: 'AI Confidence', v: `${insights.confidence}%`, c: 'text-blue-600' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{s.l}</p>
              <p className={clsx('font-mono font-bold text-[15px]', s.c || 'text-gray-700')}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Root Cause */}
      <div className="card-clean p-6 mb-5 rc" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Root Cause Analysis</span>
          <span className="badge-sm badge-blue">AI Generated</span>
        </div>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
          Revenue is at risk because failures concentrated in specific banks and hours. <span className="font-semibold text-gray-900">{totalFailed.toLocaleString('en-IN')}</span> of {totalTxns.toLocaleString('en-IN')} transactions failed ({analysis?.successRate || 100}% success rate).{topBanks.length > 0 ? <> The top {Math.min(3, topBanks.length)} banks ({topBanks.slice(0, 3).map((b) => b.name).join(', ')}) account for <span className="font-semibold text-gray-900">{insights.concentration.toFixed(0)}%</span> of all failures.</> : null}
        </p>

        <div className="space-y-3 mb-6">
          {topBanks.map((bank, i) => {
            const rate = bank.total > 0 ? (bank.failed / bank.total * 100) : 0;
            return (
              <div key={bank.code} className="flex items-center gap-4">
                <span className="text-[12px] text-gray-500 w-[110px] flex-shrink-0">{bank.name}</span>
                <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                  <div className={clsx('h-full rounded-lg flex items-center justify-end px-3 text-[10px] font-mono font-bold text-white', rate > 10 ? 'bg-gradient-to-r from-red-500 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500')}
                    style={{ width: `${Math.min(100, rate * 5)}%` }}>
                    {rate.toFixed(1)}%
                  </div>
                </div>
                <span className={clsx('badge-sm', rate > 15 ? 'badge-rose' : rate > 10 ? 'badge-amber' : 'badge-emerald')}>
                  {rate > 15 ? 'CRITICAL' : rate > 10 ? 'HIGH' : 'OK'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-100 border-l-[3px] border-l-blue-500 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Lightning weight="fill" className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[12px] text-blue-700 font-semibold">AI Agent Explanation</span>
          </div>
          <p className="text-[12.5px] text-gray-600 leading-relaxed">
            {insights.worstBank ? <>The worst affected endpoint is <span className="font-semibold text-gray-900">{insights.worstBank.name}</span> at a {insights.worstBank.rate.toFixed(1)}% failure rate.</> : 'No bank-level failure rates available in this snapshot.'}
            {insights.peakWindow ? <> Failures peak between <span className="font-semibold text-gray-900">{String(insights.peakWindow.start).padStart(2, '0')}:00–{String(insights.peakWindow.end).padStart(2, '0')}:59</span> ({insights.peakShare.toFixed(0)}% of failures).</> : null}
            {' '}Diagnosis confidence is derived from failure concentration and peak clarity. <span className="text-emerald-600 font-semibold">Confidence: {insights.confidence}%</span>
          </p>
        </div>
      </div>

      {/* Edge Cases — Flagged for Human Review */}
      <div className="card-clean p-6 mb-5 rc" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Edge Cases — Flagged for Human Review</span>
          <span className="badge-sm badge-amber">{exceptions.length} open</span>
        </div>
        {exceptions.length === 0 ? (
          <p className="text-[12.5px] text-gray-500">No edge cases in this snapshot — every signal is strong enough to act on with confidence.</p>
        ) : (
          <div className="space-y-3">
            {exceptions.map((e) => (
              <div key={`${e.id}-${e.title}`} className="flex gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50/60">
                <div className="flex-shrink-0">
                  {e.severity === 'warning'
                    ? <Warning weight="fill" className="w-4 h-4 text-amber-500 mt-0.5" />
                    : <Info weight="fill" className="w-4 h-4 text-blue-500 mt-0.5" />}
                </div>
                <div>
                  <p className="text-[12.5px] font-semibold text-gray-900">{e.title}</p>
                  <p className="text-[12px] text-gray-600 mt-0.5 leading-relaxed">{e.detail}</p>
                  <p className="text-[11px] text-amber-700 mt-1.5 flex items-center gap-1.5">
                    <Shield weight="fill" className="w-3 h-3 flex-shrink-0" /> {e.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customers */}
      <div className="card-clean p-6 mb-5 rc" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Affected Customers</span>
          <span className="badge-sm badge-amber">{totalFailed} customers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {['Customer', 'Amount', 'Bank', 'Status'].map(h => (
                  <th key={h} className="pb-2.5 text-[9px] text-gray-400 uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topFailed.map((txn) => (
                <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 text-[12px] text-gray-700">{txn.customer}</td>
                  <td className="py-2.5 text-[12px] font-mono font-semibold text-gray-800">{formatCurrency(txn.amount)}</td>
                  <td className="py-2.5 text-[12px] text-gray-500">{txn.bankCode}</td>
                  <td className="py-2.5 text-[11px] text-red-500">{txn.failureReason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Plan */}
      <div className="card-clean p-6 rc" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">💡 What Should We Do?</span>
          <span className="badge-sm badge-blue">AI Recommended</span>
        </div>
        <h3 className="text-[16px] font-bold text-gray-900 mb-2">Send recovery links with alternate payment methods</h3>
        <p className="text-[12.5px] text-gray-500 mb-5">Resend payment requests to eligible customers with Net Banking / Card alternatives.</p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { l: 'Expected Recovery', v: `${formatCurrency(insights.recoverLow)} – ${formatCurrency(insights.recoverHigh)}`, c: 'text-emerald-600' },
            { l: 'Risk Level', v: 'LOW', c: 'text-emerald-600' },
            { l: 'Required', v: 'Customer approval', c: 'text-gray-600' },
          ].map((m, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{m.l}</p>
              <p className={clsx('font-mono font-bold text-[13px]', m.c)}>{m.v}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {['No amount changes', 'No auto refunds', 'Customer must approve', 'Full audit trail'].map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-700">
              <Shield weight="fill" className="w-3 h-3 flex-shrink-0" /> {r}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-3 btn-green flex items-center justify-center gap-2 text-[13px]">💰 Execute Recovery</button>
          <button className="flex-1 py-3 btn-secondary">🔮 What-If</button>
        </div>
      </div>
    </div>
  );
}
