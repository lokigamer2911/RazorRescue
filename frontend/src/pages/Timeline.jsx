import { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { animate, stagger } from 'animejs';
import clsx from 'clsx';

const dotColors = { danger: 'bg-rose', success: 'bg-emerald', warning: 'bg-amber', info: 'bg-cyan' };

export default function Timeline() {
  const { timeline } = useAppState();
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const items = ref.current.querySelectorAll('.tl-item');
    const c = animate(items, { opacity: [0, 1], translateX: [-16, 0], duration: 500, delay: stagger(60, { start: 100 }), ease: 'outExpo' });
    return () => c.pause();
  }, [timeline]);

  return (
    <div className="p-6 lg:p-8 max-w-[700px] mx-auto">
      <h2 className="text-[22px] font-bold tracking-tight text-white/90 mb-1">
        <Clock className="w-5 h-5 text-cyan-400 inline mr-2 -mt-1" /> AI Activity Timeline
      </h2>
      <p className="text-[13px] text-white/25 mb-8">Complete record of every AI action</p>

      <div className="relative pl-8" ref={ref}>
        <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-white/[0.04]" />
        {timeline.map((entry, i) => (
          <div key={i} className="relative pb-6 last:pb-0 tl-item">
            <div className={clsx('absolute left-[-22px] top-1.5 w-2.5 h-2.5 rounded-full border-[2.5px] border-navy-900', dotColors[entry.type] || 'bg-cyan')} />
            <div className="bg-white/[0.02] border border-white/[0.03] rounded-xl p-4 hover:bg-white/[0.03] transition-colors">
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
