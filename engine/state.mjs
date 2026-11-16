export const newGame = (seed = Date.now()) => ({
  month: 0, startAge: 19, rngSeed: seed >>> 0, flags: {}, seenEvents: [],
  cash: 72000, savings: 0, billsArrears: 0,
  income: { monthly: 90000 }, expenses: { monthly: 75000 }, spending: { monthly: 8000 },
  card: {
    balance: 0, limit: 100000, apr: 0.24, penaltyApr: 0.2999,
    penaltyActive: false, graceActive: true, statementBalance: 0,
    minimumDue: 0, daysPastDue: 0, lateFeesLast6: 0, monthsOpen: 0,
    onTimeStreak: 0, lateMarks: [], inquiries: [0], interestPaid: 0, feesPaid: 0,
  },
  credit: { score: null, history: [] }, paymentPolicy: 'full', fixedPayment: 5000,
  log: [], pending: null, phase: 'monthly',
});
export const ageOf = s => s.startAge + Math.floor(s.month / 12);
export const dateOf = s => ({ year: 2026 + Math.floor((s.month + 8) / 12), monthIndex: (s.month + 8) % 12 });
export const utilization = s => s.card.limit ? s.card.balance / s.card.limit : 0;
export const totalDebt = s => s.card.balance + (s.billsArrears || 0);
export const netWorth = s => s.cash + s.savings - totalDebt(s);
export const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
