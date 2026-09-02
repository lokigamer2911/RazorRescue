import { useEffect, useRef } from 'react';
import { TrendingUp, Shield, Brain, Zap, Activity, Search, DollarSign, Play } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useAppState } from '../hooks/useAppState';
import { useCountCurrency } from '../hooks/useAnime';
import { formatCurrency } from '../utils/simulation';
import Scene3D from '../components/Scene3D';
import { animate, stagger } from 'animejs';
import clsx from 'clsx';

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  failures: i >= 18 && i <= 21 ? Math.round(40 + Math.random() * 60) : Math.round(5 + Math.random() * 15),
}));

export default function CommandCenter() {
  const { analysis, estimatedRecovery, autoDemoRunning, runAutoDemo, setView } = useAppState();
  const cardsRef = useRef(null);

  const riskRef = useCountCurrency(147230, 1500, 300);
  const recoveredRef = useCountCurrency(estimatedRecovery, 1500, 500);

  useEffect(() => {
    if (!cardsRef.current) return;
    const cards = cardsRef.current.querySelectorAll('.reveal-card');
    const controls = animate(cards, {
      opacity: [0, 1], translateY: [30, 0], duration: 800,
      delay: stagger(80, { start: 200 }), ease: 'outExpo',
    });
    return () => controls.pause();
  }, []);

  useEffect(() => {
    const bars = document.querySelectorAll('.progress-bar-fill');
    const controls = animate(bars, {
      width: (el) => el.dataset.target || '0%',
      duration: 1200, delay: stagger(150, { start: 600 }), ease: 'outExpo',
    });
    return () => controls.pause();
  }, []);

  const breakdown = [
    { icon: '🔴', name: 'Payment Failures', desc: '↑ 38% in 2 hours', amount: 62000, pct: 42, color: '#f43f5e' },
    { icon: '🟠', name: 'Checkout Abandon', desc: '↑ 21% increase', amount: 41000, pct: 28, color: '#f59e0b' },
    { icon: '🟡', name: 'Subscriptions', desc: '₹27K at risk', amount: 27000, pct: 18, color: '#eab308' },
    { icon: '🟣', name: 'High-Risk Users', desc: 'Churn > 70%', amount: 17000, pct: 12, color: '#8b5cf6' },
  ];

  const steps = [
    'Detected abnormal payment failure rate',
    'Compared against 7-day baseline',
    'Identified UPI as primary failure',
    'Segmented 428 affected transactions',
    'Calculated ₹62,400 revenue at risk',
    'Checked available recovery actions',
  ];

  return (
    <div className="relative min-h-full">
      <Scene3D />
      <div className="ambient-orb top-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan/[0.06]" />
      <div className="ambient-orb bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-violet/[0.04]" />

      <div className="relative z-10 p-6 lg:p-8" ref={cardsRef}>
        {/* Hero Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Revenue at Risk */}
          <div className="card-glass p-6 reveal-card noise" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Revenue at Risk</span>
              <span className="badge badge-rose"><TrendingUp className="w-3 h-3" /> 18.4%</span>
            </div>
            <div ref={riskRef} className="text-[48px] font-mono font-black tracking-tighter leading-none mb-2 text-gradient-rose">₹0</div>
            <p className="text-[12px] text-white/20 mb-4">Across 10,000 transactions analysed</p>
            <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="progress-bar-fill h-full rounded-full bg-gradient-to-r from-rose to-amber" data-target="62%" style={{ width: '0%' }} />
            </div>
            <p className="text-[11px] text-white/15 mt-2">14.7% of potential revenue</p>
          </div>

          {/* Estimated Recovery — THE MONEY SHOT */}
          <div className="card-glass p-6 reveal-card noise relative overflow-hidden" style={{ opacity: 0 }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald/[0.05] rounded-full blur-[60px]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Estimated Recovery</span>
                <span className="badge badge-emerald"><TrendingUp className="w-3 h-3" /> AI Ready</span>
              </div>
              <div ref={recoveredRef} className="text-[48px] font-mono font-black tracking-tighter leading-none mb-2 text-gradient-emerald">₹0</div>
              <p className="text-[12px] text-white/20 mb-4">Recovery rate: 67-79% expected</p>
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="progress-bar-fill h-full rounded-full bg-gradient-to-r from-emerald to-cyan-400" data-target="58%" style={{ width: '0%' }} />
              </div>
              <p className="text-[11px] text-white/15 mt-2">AI recovery engine primed</p>
            </div>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="card-glass p-6 mb-5 reveal-card noise" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Revenue Risk Breakdown</span>
            <span className="badge badge-cyan">AI Analysed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {breakdown.map((item, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-all cursor-pointer">
                <div className="text-lg mb-2">{item.icon}</div>
                <p className="text-[13px] font-semibold text-white/80 mb-0.5">{item.name}</p>
                <p className="text-[11px] text-white/25 mb-3">{item.desc}</p>
                <p className="text-lg font-mono font-bold mb-2" style={{ color: item.color }}>{formatCurrency(item.amount)}</p>
                <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="progress-bar-fill h-full rounded-full" data-target={(item.pct) + '%'} style={{ width: '0%', background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detections + Recommendation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* AI Detections */}
          <div className="card-glass p-5 reveal-card noise" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">AI Detections</span>
              <span className="badge badge-rose">● LIVE</span>
            </div>
            <div className="space-y-3">
              {[
                { sev: 'critical', title: 'UPI failure spike', detail: '38% increase — HIGH', time: '2 min ago' },
                { sev: 'warning', title: 'Checkout abandonment', detail: '21% increase — MEDIUM', time: '8 min ago' },
                { sev: 'info', title: 'Subscription failures', detail: '₹27K at risk — MEDIUM', time: '15 min ago' },
              ].map((d, i) => (
                <div key={i} className="flex gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.03]">
                  <div className={clsx('w-[3px] rounded-full flex-shrink-0', d.sev === 'critical' && 'bg-rose', d.sev === 'warning' && 'bg-amber', d.sev === 'info' && 'bg-cyan')} />
                  <div>
                    <p className="text-[12px] font-semibold text-white/70">{d.title}</p>
                    <p className="text-[11px] text-white/25">{d.detail}</p>
                    <p className="text-[10px] text-white/15 mt-1">{d.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="lg:col-span-2 card-glass p-6 reveal-card noise relative overflow-hidden" style={{ opacity: 0 }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan/[0.03] rounded-full blur-[80px]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">AI Recommendation</span>
                </div>
                <span className="badge badge-cyan">91% confidence</span>
              </div>
              <p className="text-[14px] text-white/45 leading-relaxed mb-5">
                "I found <span className="text-white/90 font-semibold">428 customers</span> affected by the UPI failure spike.{' '}
                <span className="text-white/90 font-semibold">{formatCurrency(62400)}</span> is potentially recoverable through payment link resends with alternate method suggestions."
              </p>
              <div className="flex items-center gap-3 p-3 bg-emerald/[0.05] border border-emerald/10 rounded-xl mb-5">
                <Shield className="w-4 h-4 text-emerald flex-shrink-0" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-white/35">Risk:</span>
                  <span className="px-2 py-0.5 bg-emerald text-white text-[10px] font-bold rounded">LOW</span>
                  <span className="text-[11px] text-white/25">No amount changes. Customer must approve.</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setView('investigation')} className="flex-1 py-3 px-5 btn-glow flex items-center justify-center gap-2 text-[13px]">
                  <Search className="w-4 h-4" /> Show Me Why
                </button>
                <button onClick={() => setView('recovery')} className="flex-1 py-3 px-5 btn-glow-green flex items-center justify-center gap-2 text-[13px]">
                  <DollarSign className="w-4 h-4" /> Recover {formatCurrency(62400)}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Reasoning + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="card-glass p-5 reveal-card noise" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">AI Agent Reasoning</span>
              </div>
              <span className="badge badge-violet">Analyzing</span>
            </div>
            <div className="space-y-2.5">
              {steps.map((text, i) => (
                <div key={i} className="flex items-center gap-3 py-1 text-[12px] text-white/35">
                  <div className="w-5 h-5 rounded-full bg-emerald/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] text-emerald font-bold">✓</span>
                  </div>
                  <span>{text}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 py-1 text-[12px] text-cyan-400 font-medium">
                <div className="w-5 h-5 rounded-full border-2 border-cyan/30 border-t-cyan animate-spin flex-shrink-0" />
                <span>Evaluating recovery strategies...</span>
              </div>
            </div>
          </div>

          <div className="card-glass p-5 reveal-card noise" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Failure Rate by Hour</span>
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.15)' }} axisLine={false} tickLine={false} interval={3} />
                  <Tooltip contentStyle={{ background: 'rgba(4,6,14,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', fontSize: '12px', color: '#c8d6e5' }} />
                  <Area type="monotone" dataKey="failures" stroke="#06b6d4" strokeWidth={2} fill="url(#failGrad)" dot={false} animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Auto-Demo Button + Radar */}
        <div className="card-glass p-6 mb-5 reveal-card noise relative overflow-hidden" style={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan/[0.02] to-violet/[0.02]" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-[15px] font-bold text-white/85 mb-1">🎬 Watch the AI in Action</h3>
              <p className="text-[12px] text-white/30">Simulate a payment incident and watch the AI detect, investigate, and recover automatically</p>
            </div>
            <button onClick={runAutoDemo} disabled={autoDemoRunning}
              className={clsx('px-6 py-3 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2', autoDemoRunning ? 'bg-cyan/20 text-cyan-400 cursor-wait' : 'btn-glow')}>
              {autoDemoRunning ? (
                <><div className="w-4 h-4 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" /> AI Working...</>
              ) : (
                <><Play className="w-4 h-4" /> Simulate Payment Incident</>
              )}
            </button>
          </div>
        </div>

        {/* Revenue Risk Radar */}
        <div className="card-glass p-6 reveal-card noise" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Revenue Risk Radar</span>
          </div>
          <div className="flex items-center gap-8 flex-wrap justify-center">
            <div className="w-32 h-32 rounded-full bg-rose/[0.05] border-2 border-rose/15 flex flex-col items-center justify-center">
              <span className="text-xl font-mono font-black text-rose">{formatCurrency(147230)}</span>
              <span className="text-[9px] text-rose/50 uppercase tracking-[0.15em] font-semibold mt-0.5">AT RISK</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-w-[300px]">
              {[
                { amt: '₹62K', label: 'Payment\nFailure', action: 'RECOVER', color: 'text-rose', bg: 'bg-rose/[0.04]' },
                { amt: '₹41K', label: 'Checkout\nAbandon', action: 'RECOVER', color: 'text-amber', bg: 'bg-amber/[0.04]' },
                { amt: '₹27K', label: 'Subscription\nFailure', action: 'RETRY', color: 'text-amber', bg: 'bg-amber/[0.04]' },
                { amt: '₹17K', label: 'High-Risk\nUsers', action: 'ENGAGE', color: 'text-violet', bg: 'bg-violet/[0.04]' },
              ].map((b, i) => (
                <div key={i} className={clsx('text-center p-4 rounded-xl border border-white/[0.03] hover:border-white/[0.08] transition-all cursor-pointer', b.bg)}>
                  <div className={clsx('text-xl font-mono font-black mb-1', b.color)}>{b.amt}</div>
                  <div className="text-[11px] text-white/25 whitespace-pre-line mb-2 leading-tight">{b.label}</div>
                  <div className="text-[9px] text-white/15 uppercase tracking-[0.1em] font-semibold">→ {b.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
