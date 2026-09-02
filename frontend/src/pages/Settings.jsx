import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Shield, Bot, Store } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import clsx from 'clsx';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

const AI_MODELS = [
  { name: 'Claude Sonnet 4', role: 'Chief Analyst', color: '#8b5cf6' },
  { name: 'GPT-4o', role: 'Pattern Detector', color: '#10b981' },
  { name: 'Gemini 2.5 Pro', role: 'Data Synthesizer', color: '#3b82f6' },
  { name: 'Claude Haiku 3.5', role: 'Fast Responder', color: '#f97316' },
  { name: 'GPT-4o Mini', role: 'Customer Profiler', color: '#06b6d4' },
  { name: 'DeepSeek R1', role: 'Deep Reasoner', color: '#8b5cf6' },
  { name: 'Gemini 2.0 Flash', role: 'Speed Analyst', color: '#14b8a6' },
  { name: 'Llama 4 Maverick', role: 'Risk Assessor', color: '#ec4899' },
  { name: 'Qwen 3 235B', role: 'Quantitative Analyst', color: '#f59e0b' },
  { name: 'GPT-4.1 Mini', role: 'Narrative Generator', color: '#ef4444' },
  { name: 'Claude 3.5 Haiku', role: 'Incident Monitor', color: '#22d3ee' },
  { name: 'Mistral Small 3.2', role: 'Compliance Checker', color: '#fb923c' },
];

const POLICIES = [
  { label: 'Maximum single recovery amount', value: '₹10,000' },
  { label: 'Daily recovery limit', value: '₹5,00,000' },
  { label: 'Require approval above', value: '₹50,000' },
  { label: 'Auto-retry enabled', value: 'Only with merchant approval' },
  { label: 'Refund authority', value: 'Merchant only' },
  { label: 'Audit log retention', value: '90 days' },
];

export default function Settings() {
  const { merchant, setMerchant } = useAppState();
  const [name, setName] = useState(merchant.name);
  const [revenue, setRevenue] = useState('10,00,000');
  const [txns, setTxns] = useState('10000');

  const save = () => {
    setMerchant({
      name,
      potentialRevenue: parseInt(revenue.replace(/,/g, '')),
      totalTransactions: parseInt(txns),
    });
  };

  return (
    <motion.div className="p-6 lg:p-8 max-w-[1200px] mx-auto" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-accent-light" /> Settings
        </h2>
        <p className="text-white/30 text-sm mt-1">Configure AI models, merchant data, and preferences</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Merchant Profile */}
        <motion.div variants={item} className="glass-hover p-6">
          <div className="flex items-center gap-2 mb-5">
            <Store className="w-4 h-4 text-accent-light" />
            <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Merchant Profile</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[12px] text-white/40 mb-1.5 block">Merchant Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-0 border border-white/[0.08] rounded-xl text-sm text-white outline-none focus:border-accent/50 transition-all"
              />
            </div>
            <div>
              <label className="text-[12px] text-white/40 mb-1.5 block">Monthly Potential Revenue</label>
              <input
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-0 border border-white/[0.08] rounded-xl text-sm text-white outline-none focus:border-accent/50 transition-all"
              />
            </div>
            <div>
              <label className="text-[12px] text-white/40 mb-1.5 block">Total Transactions</label>
              <input
                type="number"
                value={txns}
                onChange={(e) => setTxns(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-0 border border-white/[0.08] rounded-xl text-sm text-white outline-none focus:border-accent/50 transition-all"
              />
            </div>
            <button
              onClick={save}
              className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-semibold transition-all"
            >
              Save Changes
            </button>
          </div>
        </motion.div>

        {/* AI Models */}
        <motion.div variants={item} className="glass-hover p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-accent-light" />
              <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">AI Engine — 12 Models</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald/10 text-emerald text-[11px] font-semibold">Connected</span>
          </div>
          <div className="space-y-2">
            {AI_MODELS.map((model, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: model.color }} />
                <span className="text-[12px] text-white/70 flex-1">{model.name}</span>
                <span className="text-[10px] text-white/25 italic">{model.role}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Safety Policies */}
        <motion.div variants={item} className="glass-hover p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-4 h-4 text-emerald" />
            <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Safety Policies</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {POLICIES.map((policy, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <span className="text-[12px] text-white/35">{policy.label}</span>
                <span className="text-[12px] font-semibold text-accent-light font-mono">{policy.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
