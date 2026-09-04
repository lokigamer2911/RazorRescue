// Formatting + analysis helpers. All demo/simulation generators were removed —
// the app only ever analyses REAL gateway payments (see RAZORPAY_CONNECT.md).

export function formatCurrency(amount) {
  const num = Math.round(amount);
  if (num < 1000) return `₹${num}`;
  const str = num.toString();
  const lastThree = str.substring(str.length - 3);
  const rest = str.substring(0, str.length - 3);
  if (rest.length === 0) return `₹${lastThree}`;
  return `₹${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`;
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