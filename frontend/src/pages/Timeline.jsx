import { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, ArrowCounterClockwise, Play } from '@phosphor-icons/react';
import { useAppState } from '../hooks/useAppState';
import { formatCurrency } from '../utils/simulation';
import { animate, stagger } from 'animejs';
import clsx from 'clsx';

const dotColors = { danger: 'bg-red-500', success: 'bg-emerald-500', warning: 'bg-amber-500', info: 'bg-blue-500' };

// Replay script — every figure derived from the live analysis snapshot.
function makeReplaySteps(insights) {
  const f = insights || {};
  const noData = !f.total || f.total <= 0;
  const hh = (n) => String(n).padStart(2, '0');
  return [
    { time: 'now', icon: '🔴', title: 'Failure anomaly detected', desc: noData ? 'Monitoring active — awaiting transaction data' : `Overall failure rate observed at ${f.failedRate?.toFixed(1)}%`, type: 'danger', delay: 0 },
    { time: '+1s', icon: '🤖', title: 'AI detects anomaly', desc: 'Continuous monitoring triggers investigation network', type: 'info', delay: 1200 },
    { time: '+2s', icon: '🔍', title: 'Specialist agents activated', desc: 'Pattern Detector + Risk Assessor analysing in parallel', type: 'info', delay: 2400 },
    { time: '+3s', icon: '📊', title: 'Failures segmented', desc: noData ? 'By bank, amount and time window' : `${f.failed?.toLocaleString('en-IN')} failed transactions by bank, amount and time`, type: 'info', delay: 3600 },
    { time: '+4s', icon: '💰', title: 'Revenue at risk calculated', desc: noData ? 'Awaiting data' : `${formatCurrency(f.revenueAtRisk)} from failed transaction amounts`, type: 'danger', delay: 4800 },
    { time: '+5s', icon: '🧠', title: 'Recovery strategy generated', desc: noData ? 'Strategy ready once data arrives' : `Est. ${formatCurrency(f.recoverLow)}–${formatCurrency(f.recoverHigh)} via payment links`, type: 'success', delay: 6000 },
    { time: '+6s', icon: '👤', title: 'Merchant approval requested', desc: 'Waiting for approval to proceed', type: 'warning', delay: 7200 },
    { time: '+7s', icon: '✅', title: 'Recovery campaign launched', desc: 'Eligible customers contacted via SMS + Email', type: 'success', delay: 8400 },
    { time: '+13s', icon: '💰', title: 'Payments being recovered', desc: 'Response rate tracked against the modelled 60–80% range', type: 'success', delay: 9600 },
    { time: '+25s', icon: '💰', title: 'Recovery progressing', desc: 'More customers responding to links', type: 'success', delay: 10800 },
    { time: '+39s', icon: '🎉', title: 'Campaign complete', desc: noData ? 'Recovery flow finished' : `Reconciled against ${formatCurrency(f.revenueAtRisk)} at-risk ledger`, type: 'success', delay: 12000 },
  ];
}

export default function Timeline() {
  const { timeline, analysis, insights } = useAppState();
  const ref = useRef(null);
  const [replaying, setReplaying] = useState(false);
  const [replayItems, setReplayItems] = useState([]);
  const [replayIdx, setReplayIdx] = useState(-1);
  const REPLAY_STEPS = useMemo(() => makeReplaySteps(insights), [analysis, insights]);

  useEffect(() => {
    if (!ref.current) return;
    const items = ref.current.querySelectorAll('.tl');
    if (!items.length) return;
    const c = animate(items, { opacity: [0, 1], translateX: [-12, 0], duration: 400, delay: stagger(50, { start: 80 }), ease: 'outExpo' });
    return () => c.pause();
  }, [timeline, replayItems]);

  const startReplay = async () => {
    if (replaying) return;
    setReplaying(true);
    setReplayItems([]);
    for (let i = 0; i < REPLAY_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, i === 0 ? 400 : Math.max(300, REPLAY_STEPS[i].delay - REPLAY_STEPS[i - 1].delay)));
      setReplayItems((prev) => [...prev, REPLAY_STEPS[i]]);
      setReplayIdx(i);
    }
    setReplaying(false);
  };

  const items = replayItems.length > 0 ? replayItems : timeline;

  return (
    <div className="p-6 lg:p-8 max-w-[700px] mx-auto bg-gray-50/50 min-h-full">
      <h2 className="text-[22px] font-bold tracking-tight text-gray-900 mb-1">
        <Clock weight="fill" className="w-5 h-5 text-blue-600 inline mr-2 -mt-1" /> AI Activity Timeline
      </h2>
      <p className="text-[13px] text-gray-400 mb-4">Complete record of every AI action</p>

      <div className="card-clean p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-gray-800">🎬 Incident Replay</p>
          <p className="text-[11px] text-gray-400">Watch the full flow in ~12 seconds</p>
        </div>
        <button onClick={startReplay} disabled={replaying}
          className={clsx('px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-2', replaying ? 'bg-blue-100 text-blue-600 cursor-wait' : 'btn-primary')}>
          {replaying ? <><div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> Playing...</> :
            replayItems.length > 0 ? <><ArrowCounterClockwise weight="fill" className="w-3.5 h-3.5" /> Replay</> : <><Play weight="fill" className="w-3.5 h-3.5" /> Start Replay</>}
        </button>
      </div>

      <div className="relative pl-8" ref={ref}>
        <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-gray-200" />
        {items.map((e, i) => (
          <div key={i} className="relative pb-5 last:pb-0 tl">
            <div className={clsx('absolute left-[-22px] top-1.5 w-2.5 h-2.5 rounded-full border-[2.5px] border-white', dotColors[e.type] || 'bg-blue-500')} />
            <div className={clsx('bg-white border rounded-xl p-4 transition-all', i === replayIdx ? 'border-blue-200 shadow-sm' : 'border-gray-100 hover:bg-gray-50')}>
              <p className="text-[10px] text-gray-400 font-mono mb-1">{e.time}</p>
              <p className="text-[12.5px] font-semibold text-gray-800 mb-0.5">{e.icon} {e.title}</p>
              <p className="text-[11px] text-gray-400">{e.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
