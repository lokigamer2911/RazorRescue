import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Zap, ArrowRight } from 'lucide-react';

export default function ApiModal({ onConnect }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (key.startsWith('sk-or-')) {
      onConnect(key);
    } else if (key === '') {
      setError('Please enter a key');
    } else {
      setError('Invalid key — must start with sk-or-');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/[0.06] rounded-full blur-[100px]" />

      <motion.div
        className="relative w-full max-w-[480px] mx-4"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="glass p-10 text-center noise">
          {/* Icon */}
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent to-violet flex items-center justify-center shadow-glow"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Zap className="w-8 h-8 text-white" />
          </motion.div>

          <h2 className="text-2xl font-bold tracking-tight mb-2 gradient-text">Connect AI Engine</h2>
          <p className="text-white/40 text-sm mb-2">Activate the multi-model AI spiderweb</p>
          <p className="text-white/25 text-xs mb-8">
            Get your key at{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-accent-light hover:underline">
              openrouter.ai/keys
            </a>
          </p>

          {/* Input */}
          <div className="relative mb-6">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              placeholder="sk-or-v1-..."
              className="w-full pl-11 pr-4 py-3.5 bg-surface-0 border border-white/[0.08] rounded-xl text-white text-sm font-mono placeholder:text-white/20 outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all"
            />
          </div>

          {error && (
            <motion.p
              className="text-rose text-xs mb-4"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onConnect('demo')}
              className="flex-1 py-3 px-4 rounded-xl border border-white/[0.08] text-white/50 text-sm font-medium hover:bg-white/[0.03] hover:text-white/70 transition-all"
            >
              Demo Mode
            </button>
            <button
              onClick={handleConnect}
              className="flex-1 py-3 px-4 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-glow hover:shadow-glow-lg"
            >
              Connect
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-white/15 text-[11px] mt-6">Your key stays in your browser. Never stored on any server.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
