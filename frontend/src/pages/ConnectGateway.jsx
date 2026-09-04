import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightning, Lock, CheckCircle, ArrowRight, Eye, EyeSlash, ShieldCheck } from '@phosphor-icons/react';
import Spinner from '../components/Spinner';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import clsx from 'clsx';

const PROVIDERS = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    desc: 'India\'s leading payment gateway — UPI, cards, netbanking & wallets',
    recommended: true,
    fields: ['Key ID', 'Key Secret'],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    desc: 'Global payments — cards, wallets & bank transfers',
    recommended: false,
    fields: ['Secret Key'],
  },
];

export default function ConnectGateway({ onConnected }) {
  const { user } = useAuth();
  const [provider, setProvider] = useState('razorpay');
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(null); // { provider, merchantName }

  const isStripe = provider === 'stripe';

  const connect = async () => {
    setError('');
    if (!keyId.trim() || !keySecret.trim()) {
      setError('Enter both the API key id and secret to continue.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.gatewayConnect({
        provider,
        keyId: keyId.trim(),
        keySecret: keySecret.trim(),
      });
      if (!res) {
        setError('Could not reach the server. Check your connection and try again.');
        return;
      }
      if (!res.connected) {
        setError(res.error || 'Connection failed.');
        return;
      }
      setConnected({ provider: res.provider, merchantName: res.merchantName });
    } catch (err) {
      setError(err.message || 'Connection failed. Check your credentials.');
    } finally {
      setBusy(false);
    }
  };

  // Success screen — clean confirmation, then straight to the dashboard.
  if (connected) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[440px] text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6">
            <CheckCircle weight="fill" className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-[24px] font-bold tracking-tight text-gray-900 mb-2">Connected</h2>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-2">
            Your <span className="font-semibold text-gray-800 capitalize">{connected.provider}</span> account is linked to RazorRescue.
          </p>
          <p className="text-[12px] text-gray-400 mb-8">{connected.merchantName}</p>
          <button onClick={onConnected}
            className="w-full py-3.5 btn-primary rounded-xl text-[13px] font-bold flex items-center justify-center gap-2">
            Enter Dashboard <ArrowRight weight="fill" className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[520px]">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
            <Lightning weight="fill" className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-[16px] font-bold tracking-tight text-gray-900">RazorRescue</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-[22px] font-bold tracking-tight text-gray-900 mb-1.5">Connect your payment gateway</h2>
          <p className="text-[12.5px] text-gray-500 leading-relaxed mb-7">
            {user?.displayName?.split(' ')[0] || 'Welcome'} — to analyse your business, RazorRescue needs read access to your live payments. We fetch and analyse your real transactions, nothing is simulated.
          </p>

          {/* Provider picker */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {PROVIDERS.map((p) => (
              <button key={p.id} onClick={() => { setProvider(p.id); setError(''); setKeySecret(''); }}
                className={clsx('relative text-left p-4 rounded-xl border transition-all',
                  provider === p.id ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300 bg-white')}>
                {p.recommended && (
                  <span className="absolute top-2.5 right-2.5 text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                    RECOMMENDED
                  </span>
                )}
                <p className="text-[13.5px] font-bold text-gray-900 mb-1">{p.name}</p>
                <p className="text-[10.5px] text-gray-400 leading-snug">{p.desc}</p>
              </button>
            ))}
          </div>

          {/* Credentials */}
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block">{isStripe ? 'Secret Key' : 'Key ID'}</label>
              <input value={keyId} onChange={(e) => setKeyId(e.target.value)} autoComplete="off" spellCheck={false}
                placeholder={isStripe ? 'sk_live_…' : 'rzp_live_…'}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[12.5px] font-mono text-gray-700 outline-none focus:border-gray-400 transition-all" />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block">{isStripe ? 'Key (secret)' : 'Key Secret'}</label>
              <div className="relative">
                <input value={keySecret} onChange={(e) => setKeySecret(e.target.value)} autoComplete="off" spellCheck={false}
                  type={showSecret ? 'text' : 'password'}
                  placeholder={isStripe ? 'sk_live_…' : 'rzp_live_…'}
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-xl text-[12.5px] font-mono text-gray-700 outline-none focus:border-gray-400 transition-all" />
                <button onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                  {showSecret ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[11.5px] text-red-700">{error}</div>
          )}

          <button onClick={connect} disabled={busy}
            className={clsx('mt-6 w-full py-3.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2',
              busy ? 'bg-gray-100 text-gray-400 cursor-wait' : 'btn-primary')}>
            {busy ? <><Spinner className="w-4 h-4" /> Verifying with {provider === 'razorpay' ? 'Razorpay' : 'Stripe'}…</> : <>Connect & analyse payments <ArrowRight weight="fill" className="w-4 h-4" /></>}
          </button>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <Lock weight="fill" className="w-3 h-3" /> Keys encrypted at rest
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <ShieldCheck weight="fill" className="w-3 h-3" /> Read-only access
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}