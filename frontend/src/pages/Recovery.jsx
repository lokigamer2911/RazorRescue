import { useState, useEffect, useRef } from 'react';
import { CurrencyInr, RocketLaunch, Lightning, Lock, Check, X } from '@phosphor-icons/react';
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
  const { analysis, insights, autopilotMode, setAutopilotMode, addTimelineEntry, recoveryData, setRecoveryData, recoveryActive, setRecoveryActive, saveCampaign, saveAction, activeIncident } = useAppState();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Ready');
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const c = animate(ref.current.querySelectorAll('.rc'), { opacity: [0, 1], translateY: [20, 0], duration: 600, delay: stagger(60, { start: 80 }), ease: 'outExpo' });
    return () => c.pause();
  }, []);

  const launch = async () => {
    if (recoveryActive) return;
    setRecoveryActive(true);
    setStatus('Initializing');
    addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '🚀', title: 'Recovery campaign started', desc: 'Multi-channel recovery', type: 'info' });
    saveCampaign({ incidentId: activeIncident?.id || null, status: 'running', customersContacted: 0, paymentsRecovered: 0, amountRecovered: 0, recoveryRate: 0, startedAt: new Date().toISOString() });
    saveAction({ type: 'recovery', title: 'Recovery campaign launched', description: 'Sending payment links', riskLevel: 'low', status: 'completed' });

    // Campaign targets derive from the LIVE analysis snapshot — never hardcoded.
    const total = Math.max(1, insights.eligible || Math.round((analysis?.failed || 0) * 0.8) || 1);
    const amountTarget = Math.max(1, insights.recoverMid || Math.round((analysis?.revenueAtRisk || 0) * 0.7) || 1);
    const recoveredTarget = Math.max(1, Math.round(total * 0.55));
    let contacted = 0, recovered = 0, amount = 0;
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
      contacted = Math.min(total, Math.round(total * (i + 1) / 12));
      recovered = Math.min(recoveredTarget, recovered + Math.round(3 + Math.random() * Math.max(2, Math.round(recoveredTarget / 18))));
      amount = Math.min(amountTarget, amount + Math.round(Math.max(300, amountTarget / 40) + Math.random() * Math.max(300, amountTarget / 16)));
      const prog = Math.min(100, Math.round((contacted / total) * 100));
      setProgress(prog);
      setRecoveryData({ customersContacted: contacted, paymentsRecovered: recovered, amountRecovered: amount, recoveryRate: contacted > 0 ? Math.round((recovered / contacted) * 100) : 0, progress: prog });
      if (i === 3) { setStatus('Running'); addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '📨', title: `${contacted} customers contacted`, desc: 'Links sent via SMS + Email', type: 'info' }); }
      if (recovered > 40 && i === 6) addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '💰', title: `${formatCurrency(amount)} recovered`, desc: `${recovered} payments recovered`, type: 'success' });
    }
    setStatus('Complete');
    addTimelineEntry({ time: new Date().toTimeString().slice(0, 5), icon: '🎉', title: `Complete — ${formatCurrency(amount)} recovered`, desc: `Rate: ${Math.round((recovered / total) * 100)}% of ${total.toLocaleString('en-IN')} contacted`, type: 'success' });
    saveCampaign({ incidentId: activeIncident?.id || null, status: 'complete', customersContacted: contacted, paymentsRecovered: recovered, amountRecovered: amount, recoveryRate: Math.round((recovered / total) * 100), completedAt: new Date().toISOString() });
    saveAction({ type: 'recovery-complete', title: `Recovery complete: ${formatCurrency(amount)}`, description: `${recovered}/${total} customers responded`, riskLevel: 'low', status: 'completed', revenueRecovered: amount });
  };

  const perms = {
    recommend: { can: ['Detect failures', 'Analyse transactions', 'Recommend recovery', 'Send notifications'], cant: ['Transfer money', 'Change amounts', 'Issue refunds', 'Modify config', 'Retry payments'] },
    assisted: { can: ['Detect failures', 'Analyse transactions', 'Recommend recovery', 'Send notifications', 'Retry (with approval)'], cant: ['Transfer money', 'Change amounts', 'Issue refunds', 'Modify config'] },
    autopilot: { can: ['Detect failures', 'Analyse transactions', 'Recommend recovery', 'Send notifications', 'Auto-retry payments'], cant: ['Transfer money', 'Change amounts', 'Issue refunds', 'Modify config'] },
  };
  const p = perms[autopilotMode];

  return (
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto bg-gray-50/50 min-h-full" ref={ref}>
      <h2 className="text-[22px] font-bold tracking-tight text-gray-900 mb-1 rc" style={{ opacity: 0 }}>
        <CurrencyInr weight="fill" className="w-5 h-5 text-emerald-600 inline mr-2 -mt-1" /> Recovery Operations
      </h2>
      <p className="text-[13px] text-gray-400 mb-6 rc" style={{ opacity: 0 }}>Monitor and manage active recovery campaigns</p>

      <div className="card-clean p-6 mb-5 rc" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-bold text-gray-900">Campaign: Payment Failure Incident</h3>
          <span className={clsx('badge-sm', status === 'Ready' ? 'badge-blue' : status === 'Running' ? 'badge-amber' : 'badge-emerald')}>{status}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { l: 'Contacted', v: recoveryData.customersContacted },
            { l: 'Recovered', v: recoveryData.paymentsRecovered },
            { l: 'Revenue', v: formatCurrency(recoveryData.amountRecovered), g: true },
            { l: 'Rate', v: `${recoveryData.recoveryRate}%` },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
              <p className={clsx('text-[22px] font-mono font-black mb-1', s.g ? 'text-emerald-600' : 'text-gray-800')}>{s.v}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">{s.l}</p>
            </div>
          ))}
        </div>
        <button onClick={launch} disabled={recoveryActive && status === 'Running'}
          className={clsx('w-full py-4 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-2 btn-green', (recoveryActive && status === 'Running') && 'opacity-60 cursor-not-allowed')}>
          <RocketLaunch weight="fill" className="w-4 h-4" />
          {status === 'Ready' ? 'Launch Recovery Campaign' : status === 'Complete' ? '✅ Complete' : `${status}...`}
        </button>
      </div>

      <div className="card-clean p-6 rc" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Lightning weight="fill" className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Autopilot Policy</span>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setAutopilotMode(m.id)}
                className={clsx('px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all', autopilotMode === m.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <h4 className="text-emerald-600 text-[11px] font-bold mb-3 flex items-center gap-1.5"><Check weight="fill" className="w-3 h-3" /> Agent CAN:</h4>
            <div className="space-y-1.5">
              {p.can.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-700"><Check weight="fill" className="w-3 h-3 flex-shrink-0" /> {item}</div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-red-500 text-[11px] font-bold mb-3 flex items-center gap-1.5"><X weight="fill" className="w-3 h-3" /> Agent CANNOT:</h4>
            <div className="space-y-1.5">
              {p.cant.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg text-[11px] text-red-600"><Lock weight="fill" className="w-3 h-3 flex-shrink-0" /> {item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
