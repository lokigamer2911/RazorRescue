import { useState, useRef, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Bot, Store } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { animate, stagger } from 'animejs';
import clsx from 'clsx';

const MODELS = [
  { name: 'Claude Sonnet 4', role: 'Chief Analyst', color: '#8b5cf6' },
  { name: 'GPT-4o', role: 'Pattern Detector', color: '#10b981' },
  { name: 'Gemini 2.5 Pro', role: 'Data Synthesizer', color: '#3b82f6' },
  { name: 'Claude Haiku 3.5', role: 'Fast Responder', color: '#f97316' },
  { name: 'GPT-4o Mini', role: 'Customer Profiler', color: '#06b6d4' },
  { name: 'DeepSeek R1', role: 'Deep Reasoner', color: '#8b5cf6' },
  { name: 'Gemini 2.0 Flash', role: 'Speed Analyst', color: '#14b8a6' },
  { name: 'Llama 4 Maverick', role: 'Risk Assessor', color: '#ec4899' },
  { name: 'Qwen 3 235B', role: 'Quant Analyst', color: '#f59e0b' },
  { name: 'GPT-4.1 Mini', role: 'Narrative Gen', color: '#ef4444' },
  { name: 'Claude 3.5 Haiku', role: 'Incident Monitor', color: '#22d3ee' },
  { name: 'Mistral Small', role: 'Compliance', color: '#fb923c' },
];

const POLICIES = [
  { label: 'Max single recovery', val: '₹10,000' },
  { label: 'Daily limit', val: '₹5,00,000' },
  { label: 'Approval above', val: '₹50,000' },
  { label: 'Auto-retry', val: 'With approval' },
  { label: 'Refunds', val: 'Merchant only' },
  { label: 'Audit retention', val: '90 days' },
];

export default function Settings() {
  const { merchant, setMerchant } = useAppState();
  const [name, setName] = useState(merchant.name);
  const [revenue, setRevenue] = useState('10,00,000');
  const [txns, setTxns] = useState('10000');
  const cardsRef = useRef(null);

  useEffect(() => {
    if (!cardsRef.current) return;
    const cards = cardsRef.current.querySelectorAll('.reveal-card');
    const c = animate(cards, { opacity: [0, 1], translateY: [24, 0], duration: 700, delay: stagger(70, { start: 100 }), ease: 'outExpo' });
    return () => c.pause();
  }, []);

  const save = () => setMerchant({ name, potentialRevenue: parseInt(revenue.replace(/,/g, '')), totalTransactions: parseInt(txns) });

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto" ref={cardsRef}>
      <h2 className="text-[22px] font-bold tracking-tight text-white/90 mb-1 reveal-card" style={{ opacity: 0 }}>
        <SettingsIcon className="w-5 h-5 text-cyan-400 inline mr-2 -mt-1" /> Settings
      </h2>
      <p className="text-[13px] text-white/25 mb-6 reveal-card" style={{ opacity: 0 }}>Configure AI models, merchant, and policies</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Merchant */}
        <div className="card-glass p-6 reveal-card noise" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 mb-5">
            <Store className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Merchant Profile</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-white/30 mb-1 block">Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-navy-800 border border-white/[0.06] rounded-xl text-[12.5px] text-white/80 outline-none focus:border-cyan/40 transition-all" />
            </div>
            <div>
              <label className="text-[11px] text-white/30 mb-1 block">Potential Revenue</label>
              <input value={revenue} onChange={e => setRevenue(e.target.value)}
                className="w-full px-4 py-2.5 bg-navy-800 border border-white/[0.06] rounded-xl text-[12.5px] text-white/80 outline-none focus:border-cyan/40 transition-all" />
            </div>
            <div>
              <label className="text-[11px] text-white/30 mb-1 block">Transactions</label>
              <input type="number" value={txns} onChange={e => setTxns(e.target.value)}
                className="w-full px-4 py-2.5 bg-navy-800 border border-white/[0.06] rounded-xl text-[12.5px] text-white/80 outline-none focus:border-cyan/40 transition-all" />
            </div>
            <button onClick={save} className="w-full py-2.5 btn-glow text-[12px]">Save Changes</button>
          </div>
        </div>

        {/* Models */}
        <div className="card-glass p-6 reveal-card noise" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">AI Engine — 12 Models</span>
            </div>
            <span className="badge badge-emerald">Connected</span>
          </div>
          <div className="space-y-1.5">
            {MODELS.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white/[0.015] rounded-xl border border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                <span className="text-[11.5px] text-white/60 flex-1">{m.name}</span>
                <span className="text-[9.5px] text-white/20 italic">{m.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Policies */}
        <div className="card-glass p-6 lg:col-span-2 reveal-card noise" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-emerald" />
            <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Safety Policies</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {POLICIES.map((p, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3 bg-white/[0.015] rounded-xl border border-white/[0.03]">
                <span className="text-[11.5px] text-white/30">{p.label}</span>
                <span className="text-[11.5px] font-semibold text-cyan-400 font-mono">{p.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
