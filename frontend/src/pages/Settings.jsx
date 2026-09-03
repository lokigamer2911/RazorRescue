import { useState, useRef, useEffect } from 'react';
import { GearSix as SettingsIcon, Shield, Storefront, UserCircle, Phone, DeviceMobile, SealCheck, Envelope } from '@phosphor-icons/react';
import Spinner from '../components/Spinner';
import { useAppState } from '../hooks/useAppState';
import { useAuth, friendlyAuthError, isPhone, normalizePhone } from '../hooks/useAuth';
import { animate, stagger } from 'animejs';

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
  const auth = useAuth();
  const user = auth.user;

  const [name, setName] = useState(user?.displayName || '');
  const [savedName, setSavedName] = useState(false);
  const [merchantName, setMerchantName] = useState(merchant.name);
  const [revenue, setRevenue] = useState('10,00,000');
  const [txns, setTxns] = useState('10000');
  const cardsRef = useRef(null);

  /* phone linking state */
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState('idle'); // idle | otp
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!cardsRef.current) return;
    const cards = cardsRef.current.querySelectorAll('.reveal-card');
    const c = animate(cards, { opacity: [0, 1], translateY: [24, 0], duration: 700, delay: stagger(70, { start: 100 }), ease: 'outExpo' });
    return () => c.pause();
  }, []);

  const saveMerchant = () =>
    setMerchant({ name: merchantName, potentialRevenue: parseInt(revenue.replace(/,/g, '')), totalTransactions: parseInt(txns) });

  const saveName = async () => {
    setBusy(true);
    setError('');
    try {
      await auth.updateName(name);
      setSavedName(true);
      setTimeout(() => setSavedName(false), 2500);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const sendPhoneCode = async () => {
    setError('');
    setNotice('');
    if (!isPhone(phone)) return setError('Enter a valid phone number with country code (e.g. +91 98765 43210).');
    setBusy(true);
    try {
      await auth.sendLinkOtp(normalizePhone(phone));
      setPhoneStep('otp');
      setNotice(`Code sent to ${normalizePhone(phone)}.`);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmPhoneLink = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await auth.confirmLinkOtp(phoneOtp);
      setPhoneStep('idle');
      setPhone('');
      setPhoneOtp('');
      setNotice('Phone number linked. You can now log in with it too.');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[12.5px] text-gray-700 outline-none focus:border-blue-400 transition-all';

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto bg-gray-50/50 min-h-full" ref={cardsRef}>
      <h2 className="text-[22px] font-bold tracking-tight text-gray-900 mb-1 reveal-card" style={{ opacity: 0 }}>
        <SettingsIcon weight="fill" className="w-5 h-5 text-blue-600 inline mr-2 -mt-1" /> Settings
      </h2>
      <p className="text-[13px] text-gray-400 mb-6 reveal-card" style={{ opacity: 0 }}>Your account, merchant profile, and safety policies</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Account */}
        <div className="card-clean p-6 reveal-card" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 mb-5">
            <UserCircle weight="fill" className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Account</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block">Full name</label>
              <div className="flex gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your name" />
                <button onClick={saveName} disabled={busy} className="px-4 btn-primary text-[12px] whitespace-nowrap disabled:opacity-60">
                  {savedName ? 'Saved ✓' : 'Save'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block">Email</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                <Envelope weight="fill" className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[12.5px] text-gray-700 flex-1 truncate">{user?.email || '—'}</span>
                {user?.emailVerified ? (
                  <span className="badge-sm badge-emerald"><SealCheck weight="fill" className="w-3 h-3" /> Verified</span>
                ) : (
                  <button
                    onClick={async () => {
                      setBusy(true);
                      setError('');
                      try {
                        await auth.resendVerification();
                        setNotice('Verification email sent.');
                      } catch (err) {
                        setError(friendlyAuthError(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy}
                    className="badge-sm badge-amber hover:brightness-95 transition-all"
                  >
                    Verify email
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block">Phone number</label>
              {user?.phoneNumber ? (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                  <Phone weight="fill" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[12.5px] text-gray-700 flex-1">{user.phoneNumber}</span>
                  <span className="badge-sm badge-emerald"><SealCheck weight="fill" className="w-3 h-3" /> Linked</span>
                </div>
              ) : phoneStep === 'idle' ? (
                <div className="flex gap-2">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                  <button onClick={sendPhoneCode} disabled={busy} className="px-4 btn-secondary text-[12px] whitespace-nowrap disabled:opacity-60">
                    <DeviceMobile weight="fill" className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Link phone
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit code"
                      inputMode="numeric"
                      className={`${inputCls} !font-mono !tracking-[0.3em]`}
                    />
                    <button onClick={confirmPhoneLink} disabled={busy || phoneOtp.length < 6} className="px-4 btn-primary text-[12px] whitespace-nowrap disabled:opacity-60">
                      {busy ? <Spinner className="w-3.5 h-3.5" /> : 'Confirm'}
                    </button>
                  </div>
                  <button onClick={() => setPhoneStep('idle')} className="text-[11px] text-gray-400 hover:text-gray-600">
                    Change number
                  </button>
                </div>
              )}
              {!user?.phoneNumber && phoneStep === 'idle' && (
                <p className="text-[10.5px] text-gray-400 mt-1.5">Linking a phone lets you log in with an OTP instead of a password.</p>
              )}
            </div>

            {error && <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-[11.5px] text-red-700">{error}</div>}
            {notice && <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11.5px] text-emerald-700">{notice}</div>}
          </div>
        </div>

        {/* Merchant */}
        <div className="card-clean p-6 reveal-card" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 mb-5">
            <Storefront weight="fill" className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Merchant Profile</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block">Name</label>
              <input value={merchantName} onChange={(e) => setMerchantName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block">Potential Revenue</label>
              <input value={revenue} onChange={(e) => setRevenue(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-1.5 block">Transactions</label>
              <input type="number" value={txns} onChange={(e) => setTxns(e.target.value)} className={inputCls} />
            </div>
            <button onClick={saveMerchant} className="w-full py-2.5 btn-primary text-[12px]">Save Changes</button>
          </div>
        </div>

        {/* Policies */}
        <div className="card-clean p-6 lg:col-span-2 reveal-card" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2 mb-5">
            <Shield weight="fill" className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Safety Policies</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {POLICIES.map((p, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <span className="text-[11.5px] text-gray-500">{p.label}</span>
                <span className="text-[11.5px] font-semibold text-gray-900 font-mono">{p.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}