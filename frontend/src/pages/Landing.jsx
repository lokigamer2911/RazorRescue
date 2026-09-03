import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useScroll, useTransform } from 'framer-motion';
import { animate, stagger } from 'animejs';
import {
  Lightning, Pulse, ShieldCheck, ListChecks, LockKey,
  Check, ChartLineUp, CreditCard, ShoppingCart, Bank, ArrowClockwise, UsersThree,
  ArrowCounterClockwise, BellSlash, Signpost, ArrowRight, CaretDown, Terminal,
} from '@phosphor-icons/react';

/* ───────────────────────── animation helpers ────────────────────────────── */

/** Reveals all [data-reveal] children of the section when it scrolls into view. */
function useSectionReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animate(entry.target.querySelectorAll('[data-reveal]'), {
            opacity: [0, 1],
            translateY: [26, 0],
            duration: 750,
            delay: stagger(90, { start: 80 }),
            ease: 'outExpo',
          });
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ───────────────────────── small building blocks ────────────────────────── */

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-200 ring-1 ring-white/40 ring-inset">
        <Lightning weight="fill" className="w-5 h-5 text-white" />
      </div>
      <span className="font-display text-[17px] font-bold tracking-tight text-gray-900">RazorRescue</span>
    </div>
  );
}

/* Each capability gets its own emblem + colour identity, so the landing never
   falls back to one generic icon repeated everywhere. */

const FEATURE_TINTS = {
  monitor: { main: 'text-sky-600', light: 'text-sky-300', tag: 'text-sky-600', bullet: 'bg-sky-500' },
  investigate: { main: 'text-violet-600', light: 'text-violet-300', tag: 'text-violet-600', bullet: 'bg-violet-500' },
  recover: { main: 'text-emerald-600', light: 'text-emerald-300', tag: 'text-emerald-600', bullet: 'bg-emerald-500' },
  simulate: { main: 'text-amber-600', light: 'text-amber-300', tag: 'text-amber-600', bullet: 'bg-amber-500' },
};

function FeatureMark({ kind, main = 'text-gray-700', light = 'text-gray-300', className = 'w-11 h-11' }) {
  if (kind === 'monitor') {
    // a payment card with a heartbeat running across it
    return (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <rect x="6" y="13" width="36" height="23" rx="6" className={main} strokeWidth="2.6" />
        <path d="M10 24.5h6.4l2-4.5 2.9 8.6 2.2-6.3 1.7 2.2h15.4" className={light} strokeWidth="2.4" />
      </svg>
    );
  }
  if (kind === 'investigate') {
    // a magnifier over a network of causes
    return (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <circle cx="21" cy="21" r="11" className={main} strokeWidth="2.6" />
        <path d="M29.5 29.5 38 38" className={main} strokeWidth="2.6" />
        <path d="M16.5 16 21 21M21 21 27.5 14.5M21 21 25.5 25.5" className={light} strokeWidth="1.6" strokeDasharray="2 3" />
        <circle cx="16.5" cy="16" r="2.1" className={light} fill="currentColor" stroke="none" />
        <circle cx="27.5" cy="14.5" r="2.1" className={light} fill="currentColor" stroke="none" />
        <circle cx="25.5" cy="25.5" r="2.1" className={light} fill="currentColor" stroke="none" />
        <circle cx="21" cy="21" r="1.8" className={main} fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === 'recover') {
    // a shield holding the recovered check
    return (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M24 7 37 11.5v8.8c0 7.6-4.8 12.4-13 16-8.2-3.6-13-8.4-13-16v-8.8Z" className={main} strokeWidth="2.6" />
        <path d="m18.5 24 3.8 3.8 7.2-7.6" className={light} strokeWidth="3" />
      </svg>
    );
  }
  // simulate: bars of a what-if projection with an upward spark
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 37h36" className={main} strokeWidth="2.6" />
      <rect x="11.5" y="28" width="7" height="9" rx="1.6" className={main} fill="currentColor" stroke="none" />
      <rect x="21.5" y="22" width="7" height="15" rx="1.6" className={main} fill="currentColor" stroke="none" />
      <rect x="31.5" y="13" width="7" height="24" rx="1.6" className={main} fill="currentColor" stroke="none" />
      <path d="M34.5 11.5v-4.6M34.5 6.9l-2 2M34.5 6.9l2 2" className={light} strokeWidth="2.2" />
    </svg>
  );
}

function Bullet({ children, tile = 'bg-gradient-to-br from-blue-500 to-violet-500' }) {
  return (
    <li className="flex items-start gap-3 text-[13.5px] text-gray-600 leading-relaxed">
      <span className={`mt-0.5 w-5 h-5 rounded-lg ${tile} flex items-center justify-center shrink-0 shadow-sm shadow-blue-200`}>
        <Check weight="fill" className="w-3 h-3 text-white" />
      </span>
      <span>{children}</span>
    </li>
  );
}

/* Feature visual: animated sparkline (SVG draw) */
function SparklineVisual() {
  const pathRef = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const path = pathRef.current;
        if (!path) return;
        const len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        animate(path, { strokeDashoffset: [len, 0], duration: 1800, ease: 'inOutQuad' });
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    if (pathRef.current) io.observe(pathRef.current);
    return () => io.disconnect();
  }, []);
  return (
    <div className="card-clean p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="badge-sm badge-blue">Live feed</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-gray-400 font-semibold tracking-wider">LIVE</span>
        </span>
      </div>
      <svg viewBox="0 0 300 90" className="w-full">
        <path
          ref={pathRef}
          d="M5 65 C 40 62, 55 55, 75 57 S 110 68, 130 50 S 165 20, 185 30 S 225 55, 250 40 S 285 25, 295 18"
          fill="none"
          stroke="url(#sparkGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx="295" cy="18" r="4" fill="#8b5cf6" />
        <circle cx="130" cy="50" r="4" fill="#ef4444" />
      </svg>
      <div className="mt-3 flex justify-end">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] text-red-500 font-semibold">
          <ChartLineUp weight="fill" className="w-3.5 h-3.5" /> spike detected
        </span>
      </div>
    </div>
  );
}

/* Feature visual: root-cause code walk */
function CodeVisual() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        animate(ref.current.querySelectorAll('li'), {
          opacity: [0, 1],
          translateX: [18, 0],
          duration: 600,
          delay: stagger(140, { start: 200 }),
          ease: 'outExpo',
        });
        io.disconnect();
      },
      { threshold: 0.35 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div className="bg-gray-950 rounded-2xl p-5 shadow-xl shadow-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-[10px] text-gray-500 font-mono">investigate.ts</span>
      </div>
      <ul ref={ref} className="space-y-2 font-mono text-[11.5px] leading-relaxed">
        <li className="text-gray-300"><span className="text-blue-400">detect</span>(<span className="text-amber-300">"upi_failures"</span>)</li>
        <li className="text-gray-300"><span className="text-violet-400">cluster</span>(by <span className="text-cyan-300">bank</span> + <span className="text-cyan-300">hour</span>)</li>
        <li className="text-gray-300"><span className="text-emerald-400">root_cause</span> → <span className="text-gray-400">"routing degradation, 18:00–21:00"</span></li>
        <li className="text-gray-300"><span className="text-emerald-400">recommend</span>(<span className="text-amber-300">"recovery_links"</span>, risk: <span className="text-emerald-300">LOW</span>)</li>
      </ul>
    </div>
  );
}

/* Feature visual: approval gate */
function ApprovalVisual() {
  return (
    <div className="card-clean p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="badge-sm badge-amber">Awaiting approval</span>
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      </div>
      <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-[12.5px] text-gray-700 font-medium">Reach affected customers with alternate payment links</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Customer approves each retry before it is sent</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-[11.5px] font-semibold text-gray-500">Reject</div>
        <div className="flex-1 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-[11.5px] font-semibold text-white shadow-lg shadow-emerald-200">Approve</div>
      </div>
      <div className="flex items-center gap-2 text-[10.5px] text-gray-400">
        <ShieldCheck weight="fill" className="w-4 h-4 text-emerald-500" />
        The agent can recommend — it can never move money on its own.
      </div>
    </div>
  );
}

/* Feature visual: what-if bars */
function BarsVisual() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        animate(ref.current.querySelectorAll('.bar'), {
          height: (el) => [4, el.dataset.h],
          duration: 900,
          delay: stagger(80, { start: 150 }),
          ease: 'outExpo',
        });
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div className="card-clean p-5">
      <div className="flex items-center justify-between mb-5">
        <span className="badge-sm badge-violet">What-if · failures +10%</span>
        <span className="text-[10px] text-gray-400 font-mono">projection</span>
      </div>
      <div ref={ref} className="flex items-end gap-2 h-28">
        {[28, 34, 30, 44, 52, 48, 66, 74, 68, 86].map((h, i) => (
          <div key={i} data-h={`${h}%`} className="bar flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-violet-400 opacity-80" style={{ height: 4 }} />
        ))}
      </div>
      <div className="mt-3 text-[10.5px] text-gray-600 font-semibold flex justify-center">
        Exposure grows with the failure rate — the playbook is pre-built for it
      </div>
    </div>
  );
}

/* ──────────────────── hero stage: the product, floating ────────────────────
   Instead of an abstract 3D object, the hero shows the product itself: small
   live cards of the three capabilities — monitoring, investigation, recovery —
   drifting in 3D space with mouse parallax, wrapped in soft brand gradients
   and outline tiles that echo the logo mark. */

function useDrawPath(ref) {
  useEffect(() => {
    const path = ref.current;
    if (!path) return undefined;
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    const t = setTimeout(() => {
      animate(path, { strokeDashoffset: [len, 0], duration: 2200, delay: 600, ease: 'inOutQuad' });
    }, 500);
    return () => clearTimeout(t);
  }, [ref]);
}

function MonitorCard() {
  const pathRef = useRef(null);
  useDrawPath(pathRef);
  return (
    <div className="w-[240px] rounded-2xl bg-white/95 backdrop-blur border border-gray-100 shadow-xl shadow-blue-200/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9.5px] font-bold tracking-[0.16em] text-gray-500">MONITORING</span>
        </span>
        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-violet-500 flex items-center justify-center shadow-sm shadow-blue-200 ring-1 ring-white/40 ring-inset">
          <Pulse weight="fill" className="w-3.5 h-3.5 text-white" />
        </span>
      </div>
      <svg viewBox="0 0 240 54" className="w-full">
        <path
          ref={pathRef}
          d="M4 40 C 32 38, 44 32, 62 34 S 90 44, 108 30 S 140 10, 158 16 S 190 34, 208 24 S 232 14, 236 10"
          fill="none"
          stroke="url(#heroGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx="236" cy="10" r="3.5" fill="#8b5cf6" />
        <circle cx="108" cy="30" r="3.5" fill="#ef4444" />
      </svg>
      <p className="mt-2 text-[10px] text-gray-400 font-mono">watching every transaction</p>
    </div>
  );
}

function InvestigateCard() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    const t = setTimeout(() => {
      animate(ref.current.querySelectorAll('li'), {
        opacity: [0, 1],
        translateX: [14, 0],
        duration: 600,
        delay: stagger(220, { start: 200 }),
        ease: 'outExpo',
      });
    }, 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="w-[250px] rounded-2xl bg-gray-950 shadow-2xl shadow-blue-900/20 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="ml-2 text-[9px] text-gray-500 font-mono tracking-wider">agent · investigate</span>
      </div>
      <ul ref={ref} className="space-y-1.5 font-mono text-[10.5px] leading-relaxed">
        <li className="text-gray-400 opacity-0"><span className="text-blue-400">detect</span>(<span className="text-amber-300">"upi_failures"</span>)</li>
        <li className="text-gray-400 opacity-0"><span className="text-violet-400">cluster</span>(by bank × hour)</li>
        <li className="text-gray-400 opacity-0"><span className="text-emerald-400">root_cause</span> → routing issue</li>
        <li className="text-gray-400 opacity-0"><span className="text-emerald-400">recover</span> → plan ready, needs you</li>
      </ul>
    </div>
  );
}

function ApproveCard() {
  return (
    <div className="w-[230px] rounded-2xl bg-white/95 backdrop-blur border border-gray-100 shadow-xl shadow-emerald-200/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] text-emerald-600">
          <ShieldCheck weight="fill" className="w-3 h-3" /> RECOVERY READY
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>
      <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
        Re-send alternate payment links — each customer approves before a single attempt.
      </p>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-500">Reject</div>
        <div className="flex-1 h-7 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-[10px] font-semibold text-white shadow-md shadow-emerald-200">Approve</div>
      </div>
    </div>
  );
}

function RecoveredChip() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur border border-emerald-100 shadow-lg shadow-emerald-200/40 px-3.5 py-2">
      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center ring-1 ring-white/50 ring-inset">
        <Check weight="fill" className="w-3 h-3 text-white" />
      </span>
      <span className="text-[11px] font-semibold text-emerald-700">Payment recovered · retry succeeded</span>
    </div>
  );
}

function FloatingCard({ mx, my, depth, className, rotX = 0, rotY = 0, floatDur = 7, delay = 0, children }) {
  const x = useTransform(mx, (v) => v * (34 * depth));
  const y = useTransform(my, (v) => v * (24 * depth));
  return (
    <motion.div
      style={{ x, y, rotateX: rotX, rotateY: rotY, transformPerspective: 1300 }}
      className={`absolute ${className}`}
    >
      <motion.div
        animate={{ y: [0, -11, 0], rotate: [0, 0.6, 0] }}
        transition={{ duration: floatDur, repeat: Infinity, ease: 'easeInOut', delay }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function HeroBackdrop({ mx, my }) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* soft brand gradients */}
      <motion.div
        className="absolute -top-28 -left-28 w-[540px] h-[540px] rounded-full bg-gradient-to-br from-blue-200/60 via-sky-100/40 to-transparent blur-3xl"
        animate={{ x: [0, 46, -22, 0], y: [0, -34, 26, 0], scale: [1, 1.1, 0.96, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-24 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-violet-200/60 via-fuchsia-100/30 to-transparent blur-3xl"
        animate={{ x: [0, -40, 24, 0], y: [0, 30, -26, 0], scale: [1, 1.08, 0.94, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* outline tiles echoing the logo mark — pure geometry, no symbols */}
      <motion.div
        className="absolute left-[6%] top-[20%] w-24 h-24 rounded-3xl border-2 border-blue-100/90 hidden xl:block"
        animate={{ y: [0, -16, 0], rotate: [14, 10, 14] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[7%] top-[42%] w-16 h-16 rounded-2xl border-2 border-violet-100 hidden xl:block"
        animate={{ y: [0, 14, 0], rotate: [-10, -6, -10] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />
      <motion.div
        className="absolute left-[10%] bottom-[16%] w-14 h-14 rounded-2xl border-2 border-blue-100/80 hidden 2xl:block"
        animate={{ y: [0, 12, 0], rotate: [8, 4, 8] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />

      {/* the product, alive */}
      <FloatingCard mx={mx} my={my} depth={1} rotY={-12} className="hidden xl:block right-[3%] top-[11%]" floatDur={8} children={<MonitorCard />} />
      <FloatingCard mx={mx} my={my} depth={0.7} rotX={9} rotY={10} className="hidden xl:block left-[3.5%] top-[15%]" floatDur={9} delay={0.8} children={<InvestigateCard />} />
      <FloatingCard mx={mx} my={my} depth={1.15} rotX={-7} rotY={-9} className="hidden xl:block right-[5%] bottom-[12%]" floatDur={10} delay={1.4} children={<ApproveCard />} />
      <FloatingCard mx={mx} my={my} depth={0.55} className="hidden xl:block left-[4.5%] bottom-[13%]" floatDur={6.5} delay={0.4} children={<RecoveredChip />} />
    </div>
  );
}

/* ───────────────────────── main landing ─────────────────────────────────── */

const LEAK_TYPES = [
  { label: 'UPI failures', icon: CreditCard, color: 'text-rose-500', tile: 'bg-rose-100' },
  { label: 'Checkout abandonment', icon: ShoppingCart, color: 'text-amber-600', tile: 'bg-amber-100' },
  { label: 'Bank outages', icon: Bank, color: 'text-red-500', tile: 'bg-red-100' },
  { label: 'Failed retries', icon: ArrowClockwise, color: 'text-sky-500', tile: 'bg-sky-100' },
  { label: 'Subscription drops', icon: UsersThree, color: 'text-violet-600', tile: 'bg-violet-100' },
  { label: 'Refund gaps', icon: ArrowCounterClockwise, color: 'text-orange-600', tile: 'bg-orange-100' },
  { label: 'Silent failures', icon: BellSlash, color: 'text-slate-500', tile: 'bg-slate-200' },
  { label: 'Routing issues', icon: Signpost, color: 'text-cyan-600', tile: 'bg-cyan-100' },
];

export default function Landing({ onLaunch, onLogin, onSignup, loggedIn = false }) {
  const heroRef = useRef(null);
  const featuresRef = useSectionReveal();
  const howRef = useSectionReveal();
  const securityRef = useSectionReveal();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.18], [1, 0.96]);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const onPointerMove = (e) => {
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  };
  const onPointerLeave = () => {
    mx.set(0);
    my.set(0);
  };

  /* hero headline word-by-word entrance */
  useEffect(() => {
    animate('.hero-word', {
      opacity: [0, 1],
      translateY: [38, 0],
      rotateX: [35, 0],
      duration: 850,
      delay: stagger(90, { start: 250 }),
      ease: 'outExpo',
    });
    animate('.hero-fade', {
      opacity: [0, 1],
      translateY: [22, 0],
      duration: 800,
      delay: stagger(180, { start: 900 }),
      ease: 'outExpo',
    });
  }, []);

  const features = [
    {
      kind: 'monitor', tint: FEATURE_TINTS.monitor, title: 'Real-time monitoring', tag: 'See leaks the moment they happen',
      desc: 'RazorRescue watches your Razorpay transactions continuously and flags anomalies as they form — not in next week’s report.',
      bullets: ['Payment failure spikes across UPI, cards and net banking', 'Checkout abandonment and subscription drop-offs', 'Silent failures that never surface in your payout report'],
      visual: <SparklineVisual />,
    },
    {
      kind: 'investigate', tint: FEATURE_TINTS.investigate, title: 'Root-cause investigation', tag: 'Understand exactly why revenue is lost',
      desc: 'Every anomaly is investigated across bank, time-of-day and payment-method dimensions, so you get a cause — not just a chart.',
      bullets: ['Bank-level routing and downtime patterns', 'Time-of-day and day-of-week correlation', 'Payment-method and flow breakdowns'],
      visual: <CodeVisual />,
    },
    {
      kind: 'recover', tint: FEATURE_TINTS.recover, title: 'Bounded recovery actions', tag: 'Safe by design, approved by you',
      desc: 'The agent drafts the recovery plan — you approve it. It can suggest retries and payment links, but it can never move money, change amounts, or refund on its own.',
      bullets: ['Recovery plans built around alternate payment methods', 'Every action requires your explicit approval', 'Complete audit trail of every AI action'],
      visual: <ApprovalVisual />,
    },
    {
      kind: 'simulate', tint: FEATURE_TINTS.simulate, title: 'Simulate & plan ahead', tag: 'Test scenarios before real money is at stake',
      desc: 'Run synthetic incidents and what-if projections to see exposure and prepare a recovery playbook before anything actually breaks.',
      bullets: ['Synthetic incident simulator (outages, spikes, drop-offs)', 'What-if projections: “failures +10% → what happens?”', 'Pre-baked recovery playbooks per scenario'],
      visual: <BarsVisual />,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-display">
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/75 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#security" className="hover:text-gray-900 transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-2.5">
            {loggedIn ? (
              <button onClick={onLaunch} className="btn-primary text-[12.5px] flex items-center gap-2">
                Open Dashboard <ArrowRight weight="fill" className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button onClick={onLogin} className="px-4 py-2.5 text-[12.5px] font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors">
                  Log in
                </button>
                <button onClick={onSignup} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-500 text-white text-[12.5px] font-semibold shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:brightness-110 transition-all">
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <motion.section
        ref={heroRef}
        onMouseMove={onPointerMove}
        onMouseLeave={onPointerLeave}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        {/* floating product stage */}
        <HeroBackdrop mx={mx} my={my} />
        {/* soft light beams */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.10),transparent_55%)]" />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <div className="hero-fade badge-sm bg-blue-50 text-blue-600 mb-7 mx-auto w-fit border border-blue-100">
            AI revenue recovery · built for Razorpay merchants
          </div>

          <h1 className="text-[44px] md:text-[68px] font-bold tracking-tight leading-[1.04] mb-7 text-balance [perspective:600px]">
            <span className="hero-word inline-block">Stop</span>{' '}
            <span className="hero-word inline-block">losing</span>{' '}
            <span className="hero-word inline-block bg-gradient-to-r from-blue-600 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">revenue.</span>
            <br />
            <span className="hero-word inline-block">Recover</span>{' '}
            <span className="hero-word inline-block">it</span>{' '}
            <span className="hero-word inline-block">automatically.</span>
          </h1>

          <p className="hero-fade text-[16.5px] text-gray-500 leading-relaxed max-w-xl mx-auto mb-9 font-sans">
            RazorRescue is an AI agent that watches your payments, finds where money is leaking,
            explains why it’s happening, and prepares safe recovery actions — approved by you before anything moves.
          </p>

          <div className="hero-fade flex items-center justify-center gap-4 flex-wrap">
            <button onClick={loggedIn ? onLaunch : onSignup} className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-500 text-white text-[14px] font-semibold shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:brightness-110 transition-all flex items-center gap-2">
              {loggedIn ? 'Open Dashboard' : 'Get started free'} <ArrowRight weight="fill" className="w-4 h-4" />
            </button>
            <a href="#features" className="px-8 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all">
              See how it works
            </a>
          </div>

          {/* terminal-style pill */}
          <div className="hero-fade mt-10 mx-auto w-fit flex items-center gap-3 px-5 py-3 rounded-2xl bg-gray-950 text-[12px] font-mono text-gray-300 shadow-xl shadow-gray-200">
            <Terminal weight="fill" className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-500">$</span> razorrescue monitor --razorpay
            <span className="w-2 h-4 bg-emerald-400 animate-pulse" />
          </div>

          {/* product strip for narrower screens (the side cluster takes over on xl+) */}
          <div className="hero-fade hidden md:flex xl:hidden mt-10 items-center justify-center gap-4 flex-wrap px-2">
            <MonitorCard />
            <ApproveCard />
            <RecoveredChip />
          </div>

          <div className="hero-fade mt-16 flex flex-col items-center gap-2">
            <span className="text-[10.5px] text-gray-400 uppercase tracking-widest font-medium">scroll to explore</span>
            <CaretDown weight="fill" className="w-4 h-4 text-gray-300 animate-bounce" />
          </div>
        </div>
      </motion.section>

      {/* ─── Marquee ─── */}
      <div className="border-y border-gray-100 bg-gray-50/60 overflow-hidden py-3.5">
        <div className="marquee-track flex gap-4 whitespace-nowrap w-max">
          {[...Array(2)].map((_, copy) => (
            <div key={copy} className="flex gap-4 items-center">
              {LEAK_TYPES.map((k) => {
                const Icon = k.icon;
                return (
                  <span key={k.label} className="inline-flex items-center gap-2.5 rounded-full border border-gray-200/80 bg-white px-4 py-1.5 text-[12px] text-gray-600 font-medium shadow-sm">
                    <span className={`w-6 h-6 rounded-full ${k.tile} flex items-center justify-center`}>
                      <Icon weight="fill" className={`w-3.5 h-3.5 ${k.color}`} />
                    </span>
                    {k.label}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Feature rows (animejs-style) ─── */}
      <section id="features" ref={featuresRef} className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <p data-reveal className="text-[11px] text-blue-600 font-semibold uppercase tracking-[0.2em] mb-3">The complete workflow</p>
            <h2 data-reveal className="text-[34px] md:text-[44px] font-bold tracking-tight mb-4 text-balance">
              One agent.<br />Every rupee accounted for.
            </h2>
            <p data-reveal className="text-[15px] text-gray-500 max-w-lg mx-auto font-sans">
              From the moment a payment fails to the moment revenue is recovered — RazorRescue handles the whole journey.
            </p>
          </div>

          <div className="space-y-20 md:space-y-28">
            {features.map((f) => {
              return (
                <div key={f.title} className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                  <div data-reveal className="order-2 md:order-1">
                    <div className="flex items-center gap-4 mb-5">
                      <FeatureMark kind={f.kind} main={f.tint.main} light={f.tint.light} className="w-12 h-12 shrink-0" />
                      <span className={`text-[11px] font-semibold uppercase tracking-wider ${f.tint.tag}`}>{f.tag}</span>
                    </div>
                    <h3 className="text-[26px] font-bold tracking-tight mb-3">{f.title}</h3>
                    <p className="text-[14px] text-gray-500 leading-relaxed mb-6 font-sans">{f.desc}</p>
                    <ul className="space-y-2.5">
                      {f.bullets.map((b, i) => <Bullet key={i} tile={f.tint.bullet}>{b}</Bullet>)}
                    </ul>
                  </div>
                  <div data-reveal className="order-1 md:order-2">{f.visual}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How it works strip ─── */}
      <section id="how-it-works" ref={howRef} className="py-20 bg-gradient-to-b from-white to-blue-50/60 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p data-reveal className="text-[11px] text-blue-600 font-semibold uppercase tracking-[0.2em] mb-3">How it works</p>
            <h2 data-reveal className="text-[30px] md:text-[38px] font-bold tracking-tight">Detect → Investigate → Recover</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { kind: 'monitor', tint: FEATURE_TINTS.monitor, t: 'Monitor', d: 'RazorRescue watches every transaction in real time and scores failure patterns the moment they appear.' },
              { kind: 'investigate', tint: FEATURE_TINTS.investigate, t: 'Investigate', d: 'It traces each leak to its root cause — bank, timing, method — and explains it in plain language.' },
              { kind: 'recover', tint: FEATURE_TINTS.recover, t: 'Recover', d: 'It drafts a safe recovery plan. You approve, it executes, and every rupee recovered is tracked.' },
            ].map((s, i) => {
              return (
                <div key={i} data-reveal className="card-clean p-7">
                  <FeatureMark kind={s.kind} main={s.tint.main} light={s.tint.light} className="w-12 h-12 mb-4" />
                  <h3 className="text-[15px] font-bold mb-2">{s.t}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed font-sans">{s.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Security / honesty band ─── */}
      <section id="security" ref={securityRef} className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p data-reveal className="text-[11px] text-blue-600 font-semibold uppercase tracking-[0.2em] mb-3">Security by default</p>
          <h2 data-reveal className="text-[28px] md:text-[36px] font-bold tracking-tight mb-4">An agent you can say “no” to</h2>
          <p data-reveal className="text-[14.5px] text-gray-500 max-w-xl mx-auto mb-10 font-sans">
            Every AI capability is bounded by design. RazorRescue analyses and recommends — it never acts on money without your explicit approval, and every action leaves a full audit trail.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            {[
              { icon: ShieldCheck, tile: 'from-emerald-500 to-emerald-600', halo: 'shadow-emerald-200', t: 'Bounded actions', d: 'Detect, analyse, recommend. Approve before anything happens.' },
              { icon: ListChecks, tile: 'from-sky-500 to-blue-600', halo: 'shadow-sky-200', t: 'Full audit trail', d: 'Every AI decision logged and explainable — no black boxes.' },
              { icon: LockKey, tile: 'from-violet-500 to-purple-600', halo: 'shadow-violet-200', t: 'Secure accounts', d: 'Login via Firebase Auth — passwords hashed, never stored in our systems.' },
            ].map((c, i) => {
              const C = c.icon;
              return (
                <div key={i} data-reveal className="card-clean p-6">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.tile} flex items-center justify-center mb-3 shadow-md ${c.halo} ring-1 ring-white/40 ring-inset`}>
                    <C weight="fill" className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-[14px] font-bold mb-1.5">{c.t}</h3>
                  <p className="text-[12.5px] text-gray-500 leading-relaxed font-sans">{c.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-12 md:p-16 shadow-2xl shadow-blue-200">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
            <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full border border-white/20" />
            <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full border border-white/15" />
            <div className="relative">
              <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight mb-4 text-white text-balance">
                Stop guessing where your money goes.
              </h2>
              <p className="text-[15px] text-blue-100 mb-9 max-w-md mx-auto font-sans">
                Connect your Razorpay account and let the agent find every rupee at risk — starting today.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button onClick={loggedIn ? onLaunch : onSignup} className="px-8 py-3.5 rounded-2xl bg-white text-blue-700 text-[14px] font-bold shadow-xl hover:bg-blue-50 transition-all flex items-center gap-2">
                  {loggedIn ? 'Open Dashboard' : 'Create free account'} <ArrowRight weight="fill" className="w-4 h-4" />
                </button>
                {!loggedIn && (
                  <button onClick={onLogin} className="px-8 py-3.5 rounded-2xl border border-white/30 text-white text-[14px] font-semibold hover:bg-white/10 transition-all">
                    Log in
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo />
          <div className="flex items-center gap-6 text-[12px] text-gray-400">
            <a href="#features" className="hover:text-gray-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-600 transition-colors">How it works</a>
            <a href="#security" className="hover:text-gray-600 transition-colors">Security</a>
            <button onClick={onLogin} className="hover:text-gray-600 transition-colors">Log in</button>
          </div>
          <span className="text-[11.5px] text-gray-400">© 2026 RazorRescue · AI revenue recovery for Razorpay merchants</span>
        </div>
      </footer>
    </div>
  );
}
