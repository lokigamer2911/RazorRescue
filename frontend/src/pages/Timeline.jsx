import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import clsx from 'clsx';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

const dotColors = { danger: 'bg-rose', success: 'bg-emerald', warning: 'bg-amber', info: 'bg-accent' };

export default function Timeline() {
  const { timeline } = useAppState();

  return (
    <motion.div className="p-6 lg:p-8 max-w-[800px] mx-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <Clock className="w-6 h-6 text-accent-light" /> AI Activity Timeline
        </h2>
        <p className="text-white/30 text-sm mt-1">Complete record of every action taken by the AI agent</p>
      </motion.div>

      {/* Timeline */}
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-white/[0.06]" />

        {timeline.map((entry, i) => (
          <motion.div
            key={i}
            variants={item}
            className="relative pb-8 last:pb-0"
          >
            {/* Dot */}
            <div className={clsx(
              'absolute left-[-25px] top-1 w-3 h-3 rounded-full border-[3px] border-surface-0',
              dotColors[entry.type] || 'bg-accent'
            )} />

            {/* Content */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 hover:bg-white/[0.04] transition-colors">
              <p className="text-[11px] text-white/25 font-mono mb-1">{entry.time}</p>
              <p className="text-[13px] font-semibold text-white/80 mb-0.5">
                {entry.icon} {entry.title}
              </p>
              <p className="text-[12px] text-white/30">{entry.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
