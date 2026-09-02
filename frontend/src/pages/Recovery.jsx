import { useState, useEffect, useRef } from 'react';
import { DollarSign, Rocket, Zap, Lock, Check, X } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { formatCurrency } from '../utils/simulation';
import { animate, stagger } from 'animejs';
import clsx from 'clsx';

const MODES = [
  { id: 'recommend', label: 'Recommend', emoji: '🟢' },
  { id: 'assisted', label: 'Assisted', emoji: '🟡' },
  { id: 'autopilot', label: 'Autopilot', emoji: '🔴' },
];

export default function Recovery() {
  const { autopilotMode, setAutopilotMode, addTimelineEntry, recoveryData, setRecoveryData, recoveryActive, setRecoveryActive } = useAppState();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Ready');
  const cardsRef = useRef(null);

  useEffect(() => {
    if (!cardsRef.current) return;
    const cards = cardsRef.current.querySelectorAll('.reveal-card');
    const c = animate(cards, { opacity: [0, 1], translateY: [24, 0], duration: 700, delay: stagger(70, { start: 100 }), ease: 'outExpo' });
    return () => c.pause();
  }, []);

  const launch = async () => {
    if (recoveryActive) return;
    setRecoveryActive(true);
    setStatus('Initializing');
    addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '🚀', title: 'Recovery campaign started', desc: 'Multi-channel recovery for 312 customers', type: 'info' });
    const total = 312;
    let contacted = 0, recovered = 0, amount = 0;
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
      contacted = Math.min(total, Math.round(total * (i + 1) / 12));
      recovered = Math.min(150, recovered + Math.round(3 + Math.random() * 15));
      amount = Math.min(49200, amount + Math.round(1200 + Math.random() * 3600));
      const prog = Math.min(100, Math.round((contacted / total) * 100));
      setProgress(prog);
      setRecoveryData({ customersContacted: contacted, paymentsRecovered: recovered, amountRecovered: amount, recoveryRate: contacted > 0 ? Math.round((recovered / contacted) * 100) : 0, progress: prog });
      if (i === 3) { setStatus('Running'); addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '📨', title: `${contacted} customers contacted`, desc: 'Links sent via SMS + Email', type: 'info' }); }
      if (recovered > 40 && i === 6) addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '💰', title: `${formatCurrency(amount)} recovered`, desc: `${recovered} payments recovered`, type: 'success' });
    }
    setStatus('Complete');
    addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '🎉', title: `Complete — ${formatCurrency(amount)} recovered`, desc: `Rate: ${Math.round((recovered / total) * 100)}%`, type: 'success' });
  };

  const perms = {
    recommend: { can: ['Detect failures', 'Analyse transactions', 'Recommend recovery', 'Send notifications'], cant: ['Transfer money', 'Change amounts', 'Issue refunds', 'Modify config', 'Retry payments'] },
    assisted: { can: ['Detect failures', 'Analyse transactions', 'Recommend recovery', 'Send notifications', 'Retry (with approval)'], cant: ['Transfer money', 'Change amounts', 'Issue refunds', 'Modify config'] },
    autopilot: { can: ['Detect failures', 'Analyse transactions', 'Recommend recovery', 'Send notifications', 'Auto-retry payments'], cant: ['Transfer money', 'Change amounts', 'Issue refunds', 'Modify config'] },
  };
  const p = perms[autopilotMode];

  return (
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto" ref={cardsRef}>
      <div className="ambient-orb top-[-5%] right-[10%] w-[350px] h-[350px] bg-emerald/[0.04]" />
      <h2 className="text-[22px] font-bold tracking-tight text-white/90 mb-1 reveal-card" style={{ opacity: 0 }}>
        <DollarSign className="w-5 h-5 text-emerald inline mr-2 -mt-1" /> Recovery Operations
      </h2>
      <p className="text-[13px] text-white/25 mb-6 reveal-card" style={{ opacity: 0 }}>Monitor and manage active recovery campaigns</p>

      {/* Campaign */}
      <div className="card-glass p-6 mb-5 reveal-card noise" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-bold text-white/85">Campaign: UPI Failure Incident</h3>
          <span className={clsx('badge', status === 'Ready' ? 'badge-cyan' : status === 'Running' ? 'badge-amber' : 'badge-emerald')}>{status}</span>
        </div>
        <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden mb-6">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan to-emerald transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Contacted', val: recoveryData.customersContacted },
            { label: 'Recovered', val: recoveryData.paymentsRecovered },
            { label: 'Revenue', val: formatCurrency(recoveryData.amountRecovered), green: true },
            { label: 'Rate', val: `${recoveryData.recoveryRate}%` },
          ].map((s, i) => (
            <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.03] text-center">
              <p className={clsx('text-[22px] font-mono font-black mb-1', s.green ? 'text-gradient-emerald' : 'text-white/75')}>{s.val}</p>
              <p className="text-[9px] text-white/20 uppercase tracking-[0.1em]">{s.label}</p>
            </div>
          ))}
        </div>
        <button onClick={launch} disabled={recoveryActive && status === 'Running'}
          className={clsx('w-full py-4 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2', status === 'Complete' ? 'btn-glow-green' : 'btn-glow-green', (recoveryActive && status === 'Running') && 'opacity-60 cursor-not-allowed')}>
          <Rocket className="w-4 h-4" />
          {status === 'Ready' ? 'Launch Recovery Campaign' : status === 'Complete' ? '✅ Complete' : `${status}...`}
        </button>
      </div>

      {/* Autopilot */}
      <div className="card-glass p-6 mb-5 reveal-card noise" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] text-white/25 uppercase tracking-[0.1em] font-medium">Autopilot Policy</span>
          </div>
          <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setAutopilotMode(m.id)}
                className={clsx('px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all', autopilotMode === m.id ? 'bg-white/[0.06] text-white' : 'text-white/25 hover:text-white/40')}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <h4 className="text-emerald text-[11px] font-bold mb-3 flex items-center gap-1.5"><Check className="w-3 h-3" /> Agent CAN:</h4>
            <div className="space-y-1.5">
              {p.can.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald/[0.04] rounded-lg text-[11px] text-emerald/70">
                  <Check className="w-3 h-3 flex-shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-rose text-[11px] font-bold mb-3 flex items-center gap-1.5"><X className="w-3 h-3" /> Agent CANNOT:</h4>
            <div className="space-y-1.5">
              {p.cant.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-rose/[0.04] rounded-lg text-[11px] text-rose/60">
                  <Lock className="w-3 h-3 flex-shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
