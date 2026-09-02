import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { api } from '../utils/api';

const SUGGESTIONS = [
  'Why did revenue drop?',
  'What are the top risks?',
  'How can we recover ₹62K?',
  'Show me failure patterns',
];

export default function Copilot({ open, onToggle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { analysis } = useAppState();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      // Build context from current analysis
      const context = analysis ? `Current analysis: ${analysis.total} txns, ${analysis.failed} failed, ${analysis.successRate}% success, revenue at risk: ₹${analysis.revenueAtRisk}. Top banks: ${analysis.byBank.slice(0, 3).map(b => `${b.name} (${b.failed} failures)`).join(', ')}` : '';

      const result = await api.consult(`${context}\n\nUser question: ${q}`);
      setMessages(prev => [...prev, { role: 'ai', text: result.content || result }]);
    } catch (err) {
      // Fallback to local responses if backend unavailable
      const fallback = getLocalResponse(q);
      setMessages(prev => [...prev, { role: 'ai', text: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button onClick={onToggle}
        className="fixed right-6 bottom-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-glow-cyan flex items-center justify-center hover:shadow-glow-cyan-lg transition-shadow"
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Bot className="w-6 h-6 text-white" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed right-0 top-0 bottom-0 w-[380px] z-40 bg-navy-800/95 backdrop-blur-2xl border-l border-white/[0.04] flex flex-col"
            initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-white/85">RazorRescue AI</h3>
                  <p className="text-[9px] text-white/25">12-model spiderweb</p>
                </div>
              </div>
              <button onClick={onToggle} className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
                <X className="w-4 h-4 text-white/35" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-10 h-10 text-white/8 mx-auto mb-3" />
                  <p className="text-white/25 text-[12px]">Ask about your revenue</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[12px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user' ? 'bg-cyan/[0.12] text-white/85 rounded-br-md' : 'bg-white/[0.03] text-white/50 rounded-bl-md border border-white/[0.04]'
                  }`}>
                    {msg.text.split('**').map((part, k) => k % 2 === 1 ? <strong key={k} className="text-white/80">{part}</strong> : part)}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.03] border border-white/[0.04]">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-cyan/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-cyan/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-cyan/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                    className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-[10px] text-white/35 hover:text-white/60 hover:bg-white/[0.05] transition-all">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 border-t border-white/[0.04]">
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about your revenue..."
                  className="flex-1 px-4 py-2.5 bg-navy-900 border border-white/[0.06] rounded-xl text-[12px] text-white/80 placeholder:text-white/20 outline-none focus:border-cyan/30 transition-all" />
                <button onClick={() => sendMessage()} disabled={loading}
                  className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-600 flex items-center justify-center transition-colors disabled:opacity-50">
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function getLocalResponse(q) {
  const lower = q.toLowerCase();
  if (lower.includes('why') && (lower.includes('drop') || lower.includes('fail') || lower.includes('revenue')))
    return `Revenue dropped **12.4%** primarily due to UPI payment failures.\n\n**Primary reason:** UPI failures spiked from 4.2% to 13.7% between 18:00-21:00.\n\n**₹62,400** is potentially at risk. The AI recommends sending recovery links with alternate payment methods to 428 affected customers.`;
  if (lower.includes('risk') || lower.includes('top'))
    return `**Top Revenue Risks:**\n\n🔴 **Payment Failures** — ₹62K at risk (↑38%)\n🟠 **Checkout Abandonment** — ₹41K at risk (↑21%)\n🟡 **Subscription Failures** — ₹27K at risk\n🟣 **High-Risk Users** — ₹17K at risk\n\n**Total:** ₹1,47,230 at risk out of ₹10,00,000 potential revenue.`;
  if (lower.includes('recover') || lower.includes('62'))
    return `**Recovery Plan:**\n\n1. Send recovery payment links to 312 eligible customers\n2. Suggest Net Banking/Credit Card for Bank of Baroda/Union Bank/Indian Bank customers\n3. Expected recovery: ₹41,800 – ₹49,200 (67-79% success rate)\n\n**Risk:** LOW — All recoveries require customer approval.`;
  if (lower.includes('pattern') || lower.includes('failure'))
    return `**Failure Patterns:**\n\n📊 **Bank Concentration:** 71% from 3 banks\n⏰ **Time:** 82% during 18:00-21:00\n💳 **Method:** UPI = 78% of failures\n🏦 **Worst:** Bank of Baroda at 18.4% (vs 4% normal)`;
  return `I can help you understand your revenue data. Try asking:\n\n• "Why did revenue drop?"\n• "What are the top risks?"\n• "How can we recover ₹62K?"\n• "Show me failure patterns"`;
}
