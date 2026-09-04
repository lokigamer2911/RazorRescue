import { useRef, useEffect } from 'react';
import { Clock } from '@phosphor-icons/react';
import { useAppState } from '../hooks/useAppState';
import { animate, stagger } from 'animejs';
import clsx from 'clsx';

const dotColors = { danger: 'bg-red-500', success: 'bg-emerald-500', warning: 'bg-amber-500', info: 'bg-blue-500' };

export default function Timeline() {
  const { timeline } = useAppState();
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const items = ref.current.querySelectorAll('.tl');
    if (!items.length) return;
    const c = animate(items, { opacity: [0, 1], translateX: [-12, 0], duration: 400, delay: stagger(50, { start: 80 }), ease: 'outExpo' });
    return () => c.pause();
  }, [timeline]);

  return (
    <div className="p-6 lg:p-8 max-w-[700px] mx-auto bg-gray-50/50 min-h-full">
      <h2 className="text-[22px] font-bold tracking-tight text-gray-900 mb-1">
        <Clock weight="fill" className="w-5 h-5 text-blue-600 inline mr-2 -mt-1" /> AI Activity Timeline
      </h2>
      <p className="text-[13px] text-gray-400 mb-4">Record of every AI action on your live data</p>

      <div className="relative pl-8" ref={ref}>
        <div className="absolute left-[10px] top-0 bottom-0 w-[2px] bg-gray-200" />
        {timeline.map((e, i) => (
          <div key={i} className="relative pb-5 last:pb-0 tl">
            <div className={clsx('absolute left-[-22px] top-1.5 w-2.5 h-2.5 rounded-full border-[2.5px] border-white', dotColors[e.type] || 'bg-blue-500')} />
            <div className="bg-white border border-gray-100 rounded-xl p-4 transition-all hover:bg-gray-50">
              <p className="text-[10px] text-gray-400 font-mono mb-1">{e.time}</p>
              <p className="text-[12.5px] font-semibold text-gray-800 mb-0.5">{e.icon} {e.title}</p>
              <p className="text-[11px] text-gray-400">{e.desc}</p>
            </div>
          </div>
        ))}
        {timeline.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-[12px]">
            AI activity will appear here once your payment data is analysed.
          </div>
        )}
      </div>
    </div>
  );
}