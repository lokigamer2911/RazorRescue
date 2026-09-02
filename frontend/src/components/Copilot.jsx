import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';

const SUGGESTIONS = [
  'Why did revenue drop?',
  'What are the top risks?',
  'How can we recover ₹62K?',
  'Show me failure patterns',
];

const AI_RESPONSES = {
  'why did revenue drop?': `Revenue dropped **12.4%** primarily due to UPI payment failures.\n\n**Primary reason:** UPI failures spiked from 4.2% to 13.7% between 18:00-21:00.\n\n**₹62,400** is potentially at risk. The AI recommends sending recovery links with alternate payment methods to 428 affected customers.`,
  'what are the top risks?': `**Top Revenue Risks:**\n\n🔴 **Payment Failures** — ₹62K at risk (↑38%)\n🟠 **Checkout Abandonment** — ₹41K at risk (↑21%)\n🟡 **Subscription Failures** — ₹27K at risk\n🟣 **High-Risk Customers** — ₹17K at risk\n\n**Total:** ₹1,47,230 at risk.`,
  'how can we recover ₹62k?': `**Recovery Plan:**\n\n1. Send recovery payment links to 312 eligible customers\n2. Suggest Net Banking, Credit Card for affected banks\n3. Expected recovery: ₹41,800 – ₹49,200\n\n**Risk:** LOW — All recoveries require customer approval.`,
  'show me failure patterns': `**Failure Patterns:**\n\n📊 **Bank Concentration:** 71% from 3 banks\n⏰ **Time:** 82% during 18:00-21:00\n💳 **Method:** UPI = 78% of failures\n🏦 **Worst:** Bank of Baroda at 18.4%`,
};

export default function Copilot({ open, onToggle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput('');

    setMessages(prev => [...prev, { role: 'user', text: q }]);

    // Find matching response
    const lower = q.toLowerCase();
    let response = `I can help you understand your revenue data. Try asking about failures, risks, or recovery strategies.`;
    for (const [key, val] of Object.entries(AI_RESPONSES)) {
      if (lower.includes(key.split(' ').slice(0, 2).join(' '))) {
        response = val;
        break;
      }
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    }, 600);
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="fixed right-6 bottom-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-violet shadow-glow flex items-center justify-center hover:shadow-glow-lg transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bot className="w-6 h-6 text-white" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-[380px] z-40 bg-surface-1/95 backdrop-blur-2xl border-l border-white/[0.06] flex flex-col"
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-violet flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">RazorRescue AI</h3>
                  <p className="text-[10px] text-white/30">Spiderweb of 12 models</p>
                </div>
              </div>
              <button onClick={onToggle} className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Ask me about your revenue</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent/20 text-white/90 rounded-br-md'
                      : 'bg-white/[0.04] text-white/60 rounded-bl-md'
                  }`}>
                    {msg.text.split('\n').map((line, j) => (
                      <span key={j}>
                        {line.split('**').map((part, k) => 
                          k % 2 === 1 ? <strong key={k} className="text-white/90">{part}</strong> : part
                        )}
                        {j < msg.text.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/[0.06]">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about your revenue..."
                  className="flex-1 px-4 py-2.5 bg-surface-0 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 transition-all"
                />
                <button
                  onClick={() => sendMessage()}
                  className="w-10 h-10 rounded-xl bg-accent hover:bg-accent-dark flex items-center justify-center transition-colors"
                >
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
