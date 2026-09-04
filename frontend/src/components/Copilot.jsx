import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatCircleText, X, PaperPlaneRight, Sparkle, CheckCircle } from '@phosphor-icons/react';
import { useAppState } from '../hooks/useAppState';
import { api } from '../utils/api';
import { buildAnswerFromAnalysis } from '../utils/insights';
import { formatCurrency } from '../utils/simulation';

const SUGGESTIONS = [
  'Why is revenue at risk?',
  'What are the top risks?',
  'Draft a recovery plan',
  'Show me failure patterns',
];

// Shared by every AI bubble: small markdown (bold + headings).
function renderRich(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, k) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={k} className="text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('## ')) {
      return <div key={k} className="text-[12px] font-bold text-gray-800 mt-1">{part.slice(3)}</div>;
    }
    return part;
  });
}

export default function Copilot({ open, onToggle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { analysis, insights } = useAppState();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const result = await api.query(q);

      if (result && result.answer) {
        const pipeline = Array.isArray(result.pipeline) ? result.pipeline : [];
        setMessages((prev) => [...prev, {
          role: 'ai',
          text: result.answer,
          grounded: result.grounded !== false,
          pipeline,
          mode: result.mode || 'engine',
          snapshot: result.snapshot || null,
          intent: result.intent || null,
        }]);
      } else {
        // Backend unreachable → deterministic answer computed from the live
        // client-side analysis. Every number is still real (derived, not demo).
        const answer = buildAnswerFromAnalysis(analysis, q);
        const f = insights || {};
        setMessages((prev) => [...prev, {
          role: 'ai',
          text: answer,
          grounded: f.total > 0,
          pipeline: [
            { agent: 'pattern', name: 'Pattern Detector', model: 'built-in analyzer', mode: 'engine', status: 'done' },
            { agent: 'risk', name: 'Risk Assessor', model: 'built-in analyzer', mode: 'engine', status: 'done' },
            { agent: 'chief', name: 'Chief Analyst', model: 'built-in synthesizer', mode: 'engine', status: 'done' },
          ],
          mode: 'local',
          local: true,
        }]);
      }
    } catch {
      const answer = buildAnswerFromAnalysis(analysis, q);
      setMessages((prev) => [...prev, { role: 'ai', text: answer, grounded: false, mode: 'local', local: true }]);
    } finally {
      setLoading(false);
    }
  };

  const snapshotLine = insights?.total > 0
    ? `Snapshot: ${insights.total.toLocaleString('en-IN')} txns · ${insights.failed.toLocaleString('en-IN')} failed · ${formatCurrency(insights.revenueAtRisk)} at risk`
    : 'No data snapshot yet';

  return (
    <>
      <motion.button onClick={onToggle}
        className="fixed right-6 bottom-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200 flex items-center justify-center hover:shadow-xl hover:shadow-blue-200 transition-shadow"
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <ChatCircleText weight="fill" className="w-6 h-6 text-white" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed right-0 top-0 bottom-0 w-[400px] z-40 bg-white border-l border-gray-200 flex flex-col shadow-2xl"
            initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Sparkle weight="fill" className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-gray-900">RazorRescue AI</h3>
                  <p className="text-[9px] text-gray-400">Router → Specialists → Chief Analyst</p>
                </div>
              </div>
              <button onClick={onToggle} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X weight="fill" className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-gray-500 font-medium">{snapshotLine}</span>
              </div>

              {messages.length === 0 && (
                <div className="text-center py-8">
                  <ChatCircleText weight="fill" className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-[12px]">Ask about your revenue — answers are grounded in your transaction snapshot</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="max-w-[92%]">
                    <div className={`px-4 py-3 rounded-2xl text-[12px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user' ? 'bg-gray-900 text-white rounded-br-md' : 'bg-gray-50 text-gray-600 rounded-bl-md border border-gray-200'
                    }`}>
                      {msg.role === 'user' ? msg.text : renderRich(msg.text)}
                    </div>
                    {msg.role === 'ai' && msg.pipeline && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1 px-1">
                        {msg.grounded !== false && (
                          <span className="inline-flex items-center gap-1 text-[8.5px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                            <CheckCircle weight="fill" className="w-2.5 h-2.5" /> GROUNDED
                          </span>
                        )}
                        {msg.pipeline.map((p, k) => (
                          <span key={k} title={p.model}
                            className="inline-flex items-center gap-1 text-[8.5px] text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                            <span className="w-1 h-1 rounded-full bg-blue-500" /> {p.name}
                          </span>
                        ))}
                        {msg.local && (
                          <span className="text-[8.5px] text-amber-600 font-medium">· local snapshot (backend offline)</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gray-50 border border-gray-200">
                    <p className="text-[9px] text-gray-400 font-medium mb-2">Consulting agent network…</p>
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-[10px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about your revenue..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[12px] text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-400 transition-all" />
                <button onClick={() => sendMessage()} disabled={loading}
                  className="w-10 h-10 rounded-xl bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors disabled:opacity-50">
                  <PaperPlaneRight weight="fill" className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
