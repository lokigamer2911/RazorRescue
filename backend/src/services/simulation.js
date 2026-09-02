const FIRST_NAMES = ['Aarav','Vivaan','Aditya','Arjun','Sai','Rohan','Vihaan','Krishna','Aanya','Diya','Ananya','Ishita','Priya','Nisha','Kavya','Meera','Rahul','Karan','Nikhil','Amit','Deepak','Suresh','Ravi','Sanjay','Pooja','Shreya','Divya','Neha','Tanvi','Riya','Sneha','Aarti','Gaurav','Manish','Arun','Vikram','Sachin','Rajesh','Pankaj','Ashish','Smita','Lata','Usha','Geeta','Sunita','Rekha','Indira','Sarita','Kabir','Zoya','Farhan'];
const LAST_NAMES = ['Sharma','Patel','Kumar','Singh','Gupta','Jain','Verma','Reddy','Nair','Iyer','Mishra','Pandey','Tiwari','Choudhary','Malhotra','Chopra','Kapoor','Mehta','Desai','Thakur','Rao','Das','Banerjee','Mukherjee','Chatterjee','Sen','Ghosh','Bose','Dutta','Basu'];
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

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function pickWeighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
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
      failureReason: isFailed ? pick(['Bank timeout', 'Insufficient funds', 'UPI PIN incorrect', 'Network error', 'Bank declined', 'Session expired', 'Technical error']) : null,
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
  return {
    total, failed: failed.length, successRate: ((total - failed.length) / total * 100).toFixed(1),
    revenueAtRisk: failed.reduce((s, t) => s + t.amount, 0),
    byBank: Object.values(byBank).sort((a, b) => b.failed - a.failed),
    byHour, topFailed: failed.slice(0, 20),
  };
}

export function generateIncident(type, severity, transactionCount) {
  const mult = { low: 0.5, medium: 1, high: 2, critical: 3.5 }[severity] || 1;
  const base = {
    'upi-failure': { banks: ['BOB', 'UBI', 'INB'], rate: 0.045, peak: '18:00 — 21:00', cause: 'NPCI routing degradation affecting Bank of Baroda, Union Bank, and Indian Bank UPI endpoints.', strategy: 'Send recovery payment links with alternate payment method suggestions.' },
    'checkout-abandon': { banks: [], rate: 0.06, peak: '14:00 — 18:00', cause: 'Checkout page load time increased 340ms during peak hours.', strategy: 'Send cart recovery emails with direct payment links.' },
    'subscription-fail': { banks: [], rate: 0.03, peak: 'All day', cause: 'Mandate authentication failures on recurring UPI payments.', strategy: 'Retry failed mandates with updated payment instruments.' },
    'bank-outage': { banks: ['SBI'], rate: 0.12, peak: '10:00 — 16:00', cause: 'Complete SBI API downtime detected.', strategy: 'Temporarily disable affected bank. Route customers to alternatives.' },
    'combined': { banks: ['BOB', 'UBI', 'SBI'], rate: 0.09, peak: 'Multiple windows', cause: 'Combined UPI routing issues + checkout abandonment + subscription failures.', strategy: 'Multi-pronged recovery across all channels.' },
  }[type] || { banks: [], rate: 0.05, peak: '18:00 — 21:00', cause: 'Unknown incident.', strategy: 'Investigate.' };

  const affected = Math.round(transactionCount * base.rate * mult);
  const revenueAtRisk = Math.round(affected * rand(120, 220));
  const recoveryRate = rand(0.55, 0.78);

  return {
    type, severity, affectedBanks: base.banks,
    affectedTransactions: affected, revenueAtRisk,
    peakWindow: base.peak, rootCause: base.cause,
    aiConfidence: randInt(85, 96), recoveryStrategy: base.strategy,
    expectedRecovery: { low: Math.round(revenueAtRisk * recoveryRate * 0.85), high: Math.round(revenueAtRisk * recoveryRate * 1.1) },
  };
}
