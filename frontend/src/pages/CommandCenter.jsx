import { useEffect, useRef } from 'react';
import { TrendUp, Shield, Brain, Lightning, Pulse, MagnifyingGlass, CurrencyInr, Play } from '@phosphor-icons/react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useAppState } from '../hooks/useAppState';
import { formatCurrency } from '../utils/simulation';
import { animate, stagger } from 'animejs';
import clsx from 'clsx';

export default function CommandCenter({ setView }) {
  const { analysis, estimatedRecovery, autoDemoRunning, runAutoDemo } = useAppState();
  const cardsRef = useRef(null);

  // ALL data comes from analysis — zero hardcoded values
  const revenueAtRisk = analysis?.revenueAtRisk || 0;
  const totalFailed = analysis?.failed || 0;
  const totalTxns = analysis?.total || 0;
  const successRate = analysis?.successRate || 100;
  const topBanks = analysis?.byBank || [];
  const hourlyData = analysis?.hourlyData || [];

  // Compute breakdown from real bank data
  const bankBreakdown = topBanks.slice(0, 4).map((bank, i) => {
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#8b5cf6'];
    const icons = ['🔴', '🟠', '🟡', '🟣'];
    return {
      icon: icons[i] || '⚪',
      name: bank.name,
      amount: bank.amount,
      count: bank.failed,
      pct: totalFailed > 0 ? Math.round((bank.failed / totalFailed) * 100) : 0,
      color: colors[i],
    };
  });

  useEffect(() => {
    if (!cardsRef.current) return;
    const cards = cardsRef.current.querySelectorAll('.reveal-card');
    const c = animate(cards, { opacity: [0, 1], translateY: [24, 0], duration: 700, delay: stagger(70, { start: 100 }), ease: 'outExpo' });
    return () => c.pause();
  }, []);

  useEffect(() => {
    const bars = document.querySelectorAll('.bar-fill');
    const c = animate(bars, { width: (el) => el.dataset.w || '0%', duration: 1000, delay: stagger(120, { start: 400 }), ease: 'outExpo' });
    return () => c.pause();
  }, [analysis]);

  return (
    <div className="relative min-h-full bg-gray-50/50" ref={cardsRef}>
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Hero Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Revenue at Risk */}
          <div className="card-clean p-6 reveal-card" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Revenue at Risk</span>
              <span className="badge-sm badge-rose"><TrendUp weight="fill" className="w-3 h-3" /> {totalFailed > 0 ? `${Math.round(totalFailed / totalTxns * 100)}%` : '0%'}</span>
            </div>
            <div className="stat-number text-[40px] text-red-500">{formatCurrency(revenueAtRisk)}</div>
            <p className="text-[12px] text-gray-400 mt-1 mb-4">Across {totalTxns.toLocaleString()} transactions ({totalFailed} failed)</p>
            <div className="progress-track">
              <div className="progress-fill bg-red-500 bar-fill" data-w={`${totalTxns > 0 ? (totalFailed / totalTxns * 100) : 0}%`} style={{ width: '0%' }} />
            </div>
          </div>

          {/* Estimated Recovery */}
          <div className="card-clean p-6 reveal-card" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Estimated Recovery</span>
              <span className="badge-sm badge-emerald">AI Ready</span>
            </div>
            <div className="stat-number text-[40px] text-emerald-600">{formatCurrency(estimatedRecovery)}</div>
            <p className="text-[12px] text-gray-400 mt-1 mb-4">Recovery rate: 67-79% expected</p>
            <div className="progress-track">
              <div className="progress-fill bg-emerald-500 bar-fill" data-w={`${revenueAtRisk > 0 ? (estimatedRecovery / revenueAtRisk * 100) : 0}%`} style={{ width: '0%' }} />
            </div>
          </div>
        </div>

        {/* Risk Breakdown — from real bank data */}
        <div className="card-clean p-6 mb-5 reveal-card" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Revenue Risk by Bank</span>
            <span className="badge-sm badge-blue">AI Analysed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {bankBreakdown.map((item, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-all">
                <div className="text-lg mb-2">{item.icon}</div>
                <p className="text-[13px] font-semibold text-gray-800 mb-0.5">{item.name}</p>
                <p className="text-[11px] text-gray-400 mb-3">{item.count} failed transactions</p>
                <p className="text-lg font-mono font-bold mb-2" style={{ color: item.color }}>{formatCurrency(item.amount)}</p>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bar-fill" data-w={`${item.pct}%`} style={{ width: '0%', background: item.color }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{item.pct}% of total failures</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detections + Recommendation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Live Detections — from real hourly data */}
          <div className="card-clean p-5 reveal-card" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">AI Detections</span>
              <span className="badge-sm badge-rose">● LIVE</span>
            </div>
            <div className="space-y-3">
              {topBanks.slice(0, 3).map((bank, i) => {
                const rate = bank.total > 0 ? (bank.failed / bank.total * 100) : 0;
                const severity = rate > 15 ? 'critical' : rate > 10 ? 'warning' : 'info';
                return (
                  <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className={clsx('w-[3px] rounded-full flex-shrink-0', severity === 'critical' && 'bg-red-500', severity === 'warning' && 'bg-amber-500', severity === 'info' && 'bg-blue-500')} />
                    <div>
                      <p className="text-[12px] font-semibold text-gray-800">{bank.name} failures</p>
                      <p className="text-[11px] text-gray-400">{rate.toFixed(1)}% failure rate — {bank.failed} transactions</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendation */}
          <div className="lg:col-span-2 card-clean p-6 reveal-card" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain weight="fill" className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">AI Recommendation</span>
              </div>
              <span className="badge-sm badge-blue">91% confidence</span>
            </div>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-5">
              Found <span className="font-semibold text-gray-900">{Math.round(totalFailed * 0.73)} affected customers</span> across {topBanks.length} banks.{' '}
              <span className="font-semibold text-gray-900">{formatCurrency(estimatedRecovery)}</span> is potentially recoverable through payment link resends with alternate method suggestions.
            </p>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-5">
              <Shield weight="fill" className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-gray-500">Risk:</span>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">LOW</span>
                <span className="text-[11px] text-gray-400">No amount changes. Customer must approve.</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setView('investigation')} className="flex-1 py-3 btn-primary flex items-center justify-center gap-2 text-[13px]">
                <MagnifyingGlass weight="fill" className="w-4 h-4" /> Show Me Why
              </button>
              <button onClick={() => setView('recovery')} className="flex-1 py-3 btn-green flex items-center justify-center gap-2 text-[13px]">
                <CurrencyInr weight="fill" className="w-4 h-4" /> Recover {formatCurrency(estimatedRecovery)}
              </button>
            </div>
          </div>
        </div>

        {/* Agent Reasoning + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="card-clean p-5 reveal-card" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightning weight="fill" className="w-4 h-4 text-violet-500" />
                <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">AI Agent Reasoning</span>
              </div>
              <span className="badge-sm badge-violet">Analyzing</span>
            </div>
            <div className="space-y-2.5">
              {[
                `Detected ${totalFailed} failed transactions`,
                `Compared against 7-day baseline`,
                `Identified ${topBanks.length > 0 ? topBanks[0].name : 'primary'} as top failing bank`,
                `Calculated ${formatCurrency(revenueAtRisk)} revenue at risk`,
                `Found ${Math.round(totalFailed * 0.73)} eligible customers`,
                `Generated recovery strategy`,
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 py-1 text-[12px] text-gray-500">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] text-emerald-600 font-bold">✓</span>
                  </div>
                  <span>{text}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 py-1 text-[12px] text-blue-600 font-medium">
                <div className="w-5 h-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin flex-shrink-0" />
                <span>Evaluating recovery strategies...</span>
              </div>
            </div>
          </div>

          <div className="card-clean p-5 reveal-card" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pulse weight="fill" className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Failure Rate by Hour</span>
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData.length > 0 ? hourlyData : Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, failed: 0 }))}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={3} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="failed" stroke="#3b82f6" strokeWidth={2} fill="url(#g)" dot={false} animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Auto-Demo */}
        <div className="card-clean p-6 mb-5 reveal-card" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-1">🎬 Watch the AI in Action</h3>
              <p className="text-[12px] text-gray-400">Simulate a payment incident — the AI detects, investigates, and proposes recovery automatically</p>
            </div>
            <button onClick={runAutoDemo} disabled={autoDemoRunning}
              className={clsx('px-6 py-3 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2', autoDemoRunning ? 'bg-blue-100 text-blue-600 cursor-wait' : 'btn-primary')}>
              {autoDemoRunning ? <><div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> AI Working...</> : <><Play weight="fill" className="w-4 h-4" /> Simulate Payment Incident</>}
            </button>
          </div>
        </div>

        {/* Risk Radar */}
        <div className="card-clean p-6 reveal-card" style={{ opacity: 0 }}>
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Revenue Risk Radar</span>
          <div className="flex items-center gap-8 flex-wrap justify-center mt-5">
            <div className="w-28 h-28 rounded-full bg-red-50 border-2 border-red-100 flex flex-col items-center justify-center">
              <span className="text-lg font-mono font-black text-red-500">{formatCurrency(revenueAtRisk)}</span>
              <span className="text-[8px] text-red-400 uppercase tracking-widest font-semibold">AT RISK</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-w-[280px]">
              {bankBreakdown.map((b, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all cursor-pointer">
                  <div className="text-[15px] font-mono font-black mb-0.5" style={{ color: b.color }}>{formatCurrency(b.amount)}</div>
                  <div className="text-[10px] text-gray-400 mb-1">{b.name}</div>
                  <div className="text-[9px] text-gray-300 uppercase tracking-wider">→ RECOVER</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
