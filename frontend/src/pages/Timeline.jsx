import { useState, useRef, useEffect } from 'react';
import { Clock, RotateCcw, Play } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { animate, stagger } from 'animejs';
import clsx from 'clsx';

const dotColors = { danger: 'bg-rose', success: 'bg-emerald', warning: 'bg-amber', info: 'bg-cyan' };

// Pre-built replay sequence
const REPLAY_STEPS = [
  { time: '19:42', icon: '🔴', title: 'Payment failure spike begins', desc: 'UPI failure rate starts climbing from 4.2%', type: 'danger', delay: 0 },
  { time: '19:43', icon: '🤖', title: 'AI detects anomaly', desc: 'Continuous monitoring triggers investigation', type: 'info', delay: 1200 },
  { time: '19:43', icon: '🔍', title: 'Multi-model spiderweb activated', desc: '12 AI models analyzing transaction data', type: 'info', delay: 2400 },
  { time: '19:43', icon: '📊', title: '428 affected transactions identified', desc: 'Segmented by bank, amount, and time window', type: 'info', delay: 3600 },
  { time: '19:44', icon: '💰', title: '₹62,400 revenue at risk calculated', desc: 'Based on failed transaction amounts', type: 'danger', delay: 4800 },
  { time: '19:44', icon: '🧠', title: 'Recovery strategy generated', desc: 'Send payment links with alternate methods', type: 'success', delay: 6000 },
  { time: '19:45', icon: '👤', title: 'Merchant approval requested', desc: 'Waiting for CampusKart to approve', type: 'warning', delay: 7200 },
  { time: '19:46', icon: '✅', title: 'Recovery campaign launched', desc: '312 customers contacted via SMS + Email', type: 'success', delay: 8400 },
  { time: '19:52', icon: '💰', title: '₹8,240 recovered', desc: 'First batch of payments completed', type: 'success', delay: 9600 },
  { time: '20:04', icon: '💰', title: '₹17,600 recovered', desc: 'Recovery rate improving', type: 'success', delay: 10800 },
  { time: '20:18', icon: '🎉', title: '₹41,200 recovered', desc: 'Recovery campaign complete — 67% success rate', type: 'success', delay: 12000 },
];

export default function Timeline() {
  const { timeline } = useAppState();
  const ref = useRef(null);
  const [replaying, setReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(-1);
  const [replayItems, setReplayItems] = useState([]);

  useEffect(() => {
    if (!ref.current) return;
    const items = ref.current.querySelectorAll('.tl-item');
    if (items.length === 0) return;
    const c = animate(items, { opacity: [0, 1], translateX: [-16, 0], duration: 500, delay: stagger(60, { start: 100 }), ease: 'outExpo' });
    return () => c.pause();
  }, [timeline, replayItems]);

  const startReplay = async () => {
    if (replaying) return;
    setReplaying(true);
    setReplayItems([]);
    setReplayIndex(-1);

    for (let i = 0; i < REPLAY_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 500 : REPLAY_STEPS[i].delay - REPLAY_STEPS[i - 1].delay));
      setReplayItems(prev => [...prev, REPLAY_STEPS[i]]);
      setReplayIndex(i);
    }
    setReplaying(false);
  };

  const items = replayItems.length > 0 ? replayItems : timeline;

  return (
    <div className="p-6 lg:p-8 max-w-[700px] mx-auto">
      <h2 className="text-[22px] font-bold tracking-tight text-white/90 mb-1">
        <Clock className="w-5 h-5 text-cyan-400 inline mr-2 -mt-1" /> AI Activity Timeline
      </h2>
      <p className="text-[13px] text-white/25 mb-4">Complete record of every AI action</p>

      {/* Replay Button */}
      <div className="card-glass p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-white/75">🎬 Incident Replay</p>
          <p className="text-[11px] text-white/25">Watch the full detection → investigation → recovery flow in 12 seconds</p>
        </div>
        <button onClick={startReplay} disabled={replaying}
          className={clsx('px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-2',
            replaying ? 'bg-cyan/20 text-cyan-400 cursor-wait' : 'btn-glow')}>
          {replaying ? (
            <><div className="w-3.5 h-3.5 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" /> Playing...</>
          ) : replayItems.length > 0 ? (
            <><RotateCcw className="w-3.5 h-3.5" /> Replay Again</>
          ) : (
            <><Play className="w-3.5 h-3.5" /> Start Replay</>
          )}
        </button>
      </div>

      {/* Timeline */}
      <div className="relative pl-8" ref={ref}>
        <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-white/[0.04]" />
        {items.map((entry, i) => (
          <div key={i} className="relative pb-6 last:pb-0 tl-item">
            <div className={clsx('absolute left-[-22px] top-1.5 w-2.5 h-2.5 rounded-full border-[2.5px] border-navy-900', dotColors[entry.type] || 'bg-cyan')} />
            <div className={clsx('bg-white/[0.02] border rounded-xl p-4 transition-all', i === replayIndex ? 'border-cyan/20 bg-cyan/[0.03]' : 'border-white/[0.03] hover:bg-white/[0.03]')}>
              <p className="text-[10px] text-white/20 font-mono mb-1">{entry.time}</p>
              <p className="text-[12.5px] font-semibold text-white/70 mb-0.5">{entry.icon} {entry.title}</p>
              <p className="text-[11px] text-white/25">{entry.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
