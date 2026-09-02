const FIRST_NAMES = ['Aarav','Vivaan','Aditya','Arjun','Sai','Rohan','Vihaan','Krishna','Aanya','Diya','Ananya','Ishita','Priya','Nisha','Kavya','Meera','Rahul','Karan','Nikhil','Amit','Deepak','Suresh','Ravi','Sanjay','Pooja','Shreya','Divya','Neha','Tanvi','Riya','Sneha','Aarti','Gaurav','Manish','Arun','Vikram','Sachin','Rajesh','Pankaj','Ashish'];
const LAST_NAMES = ['Sharma','Patel','Kumar','Singh','Gupta','Jain','Verma','Reddy','Nair','Iyer','Mishra','Pandey','Tiwari','Choudhary','Malhotra','Chopra','Kapoor','Mehta','Desai','Thakur','Rao','Das','Banerjee','Sen','Ghosh','Bose'];
const BANKS = [
  { name: 'State Bank of India', code: 'SBI', normalFailureRate: 0.03 },
  { name: 'HDFC Bank', code: 'HDFC', normalFailureRate: 0.025 },
  { name: 'ICICI Bank', code: 'ICICI', normalFailureRate: 0.028 },
  { name: 'Bank of Baroda', code: 'BOB', normalFailureRate: 0.04 },
  { name: 'Union Bank', code: 'UBI', normalFailureRate: 0.035 },
  { name: 'Indian Bank', code: 'INB', normalFailureRate: 0.032 },
  { name: 'Punjab National Bank', code: 'PNB', normalFailureRate: 0.038 },
  { name: 'Axis Bank', code: 'AXIS', normalFailureRate: 0.027 },
  { name: 'Kotak Mahindra', code: 'KOT', normalFailureRate: 0.022 },
  { name: 'IDBI Bank', code: 'IDBI', normalFailureRate: 0.042 },
];
const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'];

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const pickWeighted = (items, weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
};

export function formatCurrency(amount) {
  const num = Math.round(amount);
  if (num < 1000) return `₹${num}`;
  const str = num.toString();
  const lastThree = str.substring(str.length - 3);
  const rest = str.substring(0, str.length - 3);
  if (rest.length === 0) return `₹${lastThree}`;
  return `₹${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`;
}

export function generateTransactions(count, options = {}) {
  const transactions = [];
  for (let i = 0; i < count; i++) {
    const hour = Math.random() < 0.4 ? randInt(18, 21) : randInt(0, 23);
    const bank = options.targetBanks
      ? pickWeighted(BANKS, BANKS.map(b => options.targetBanks.includes(b.code) ? 30 : 1))
      : pick(BANKS);
    const failureRate = options.targetBanks?.includes(bank.code) ? rand(0.12, 0.20) : bank.normalFailureRate;
    const method = options.preferredMethod || pickWeighted(PAYMENT_METHODS, [40, 20, 15, 15, 10]);
    const amount = Math.round(rand(200, 15000));
    const isFailed = Math.random() < failureRate;
    const minute = randInt(0, 59);
    transactions.push({
      id: `TXN-${String(10000 + i).padStart(6, '0')}`,
      customer: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      amount, method, bank: bank.name, bankCode: bank.code,
      status: isFailed ? 'failed' : 'success',
      failureReason: isFailed ? pick(['Bank timeout', 'Insufficient funds', 'UPI PIN incorrect', 'Network error', 'Bank declined', 'Session expired']) : null,
      hour, timestamp: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    });
  }
  return transactions;
}

export function analyseTransactions(transactions) {
  const total = transactions.length;
  const failed = transactions.filter(t => t.status === 'failed');
  const byBank = {};
  failed.forEach(t => {
    if (!byBank[t.bankCode]) byBank[t.bankCode] = { name: t.bank, code: t.bankCode, failed: 0, total: 0, amount: 0 };
    byBank[t.bankCode].failed++;
    byBank[t.bankCode].amount += t.amount;
  });
  transactions.forEach(t => { if (byBank[t.bankCode]) byBank[t.bankCode].total++; });
  const byHour = {};
  transactions.forEach(t => {
    if (!byHour[t.hour]) byHour[t.hour] = { total: 0, failed: 0 };
    byHour[t.hour].total++;
    if (t.status === 'failed') byHour[t.hour].failed++;
  });
  const byMethod = {};
  failed.forEach(t => {
    if (!byMethod[t.method]) byMethod[t.method] = { count: 0, amount: 0 };
    byMethod[t.method].count++;
    byMethod[t.method].amount += t.amount;
  });
  return {
    total, failed: failed.length,
    successRate: ((total - failed.length) / total * 100).toFixed(1),
    revenueAtRisk: failed.reduce((s, t) => s + t.amount, 0),
    byBank: Object.values(byBank).sort((a, b) => b.failed - a.failed),
    byHour, byMethod,
    topFailed: failed.slice(0, 20),
    hourlyData: Object.entries(byHour)
      .map(([h, d]) => ({ hour: parseInt(h), total: d.total, failed: d.failed, rate: d.total > 0 ? (d.failed / d.total * 100).toFixed(1) : 0 }))
      .sort((a, b) => a.hour - b.hour),
  };
}

export function generateIncident(type, severity, transactionCount = 10000) {
  const mult = { low: 0.5, medium: 1, high: 2, critical: 3.5 }[severity] || 1;
  const configs = {
    'upi-failure': { banks: ['BOB', 'UBI', 'INB'], rate: 0.045, peak: '18:00 — 21:00', cause: 'NPCI routing degradation affecting Bank of Baroda, Union Bank, and Indian Bank UPI endpoints between 17:30 and 22:00. Correlates with known infrastructure maintenance window.', strategy: 'Send recovery payment links with alternate payment method suggestions (Net Banking / Card) for affected customers.' },
    'checkout-abandon': { banks: [], rate: 0.06, peak: '14:00 — 18:00', cause: 'Checkout page load time increased 340ms during peak hours. Mobile users disproportionately affected. A/B test variant showing regression.', strategy: 'Send cart recovery emails with direct payment links. Optimize checkout for mobile. Offer express checkout.' },
    'subscription-fail': { banks: [], rate: 0.03, peak: 'All day', cause: 'Mandate authentication failures on recurring UPI payments. Card expiry dates approaching for 23% of subscribers.', strategy: 'Retry failed mandates with updated payment instruments. Send update card/expiry notifications.' },
    'bank-outage': { banks: ['SBI'], rate: 0.12, peak: '10:00 — 16:00', cause: 'Complete SBI API downtime detected. Payment gateway returning timeout errors for all SBI transactions.', strategy: 'Temporarily disable SBI as payment option. Route affected customers to alternative banks.' },
    'combined': { banks: ['BOB', 'UBI', 'SBI'], rate: 0.09, peak: 'Multiple windows', cause: 'Combined impact: UPI routing issues + elevated checkout abandonment + subscription billing failures.', strategy: 'Multi-pronged recovery: UPI links, cart recovery, subscription retry with alternate methods.' },
  };
  const cfg = configs[type] || configs['upi-failure'];
  const affected = Math.round(transactionCount * cfg.rate * mult);
  const revenueAtRisk = Math.round(affected * rand(120, 220));
  const recoveryRate = rand(0.55, 0.78);
  return {
    type, severity, affectedBanks: cfg.banks,
    affectedTransactions: affected, revenueAtRisk,
    peakWindow: cfg.peak, rootCause: cfg.cause,
    aiConfidence: randInt(85, 96), recoveryStrategy: cfg.strategy,
    expectedRecovery: { low: Math.round(revenueAtRisk * recoveryRate * 0.85), high: Math.round(revenueAtRisk * recoveryRate * 1.1) },
  };
}
