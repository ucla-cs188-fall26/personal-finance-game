// Fictional card contract for this simulation; these constants are not legal advice.
export const FIRST_LATE_FEE = 3000;
export const REPEAT_LATE_FEE = 4100;
const validMoney = amount => Number.isSafeInteger(amount) && amount >= 0;
const copy = s => ({ ...s, card: { ...s.card, lateMarks: [...s.card.lateMarks], inquiries: [...s.card.inquiries], lateFeeMonths: [...(s.card.lateFeeMonths || [])] } });
const emit = (s, type, fields = {}) => ({ type, month: s.month, ...fields });

export function charge(s, amount, what = 'purchase') {
  if (!validMoney(amount)) throw new RangeError('Purchase must be nonnegative integer cents.');
  if (!amount) return { state: s, events: [] };
  if (s.card.balance + amount > s.card.limit) return { state: s, events: [emit(s, 'declined', { amount, what })] };
  const state = copy(s);
  state.card.balance += amount;
  return { state, events: [emit(s, 'purchase', { amount, what })] };
}

export function closeStatement(s) {
  const state = copy(s), card = state.card, events = [];
  const rate = card.penaltyActive ? card.penaltyApr : card.apr;
  const fees = Math.min(card.balance, card.feesSinceStatement || 0);
  const principal = card.balance - fees;
  const interest = card.graceActive ? 0 : Math.round(card.balance * rate / 12);
  card.balance += interest;
  card.interestPaid += interest; // Cumulative interest charged, not necessarily repaid.
  if (interest) events.push(emit(s, 'interest', { amount: interest, rate }));
  card.statementBalance = card.balance;
  card.minimumDue = Math.min(card.balance, Math.max(2500, Math.round(principal * .01) + interest + fees));
  card.feesSinceStatement = 0;
  card.monthsOpen++;
  card.lateFeeMonths = card.lateFeeMonths.filter(month => s.month - month < 6);
  card.lateFeesLast6 = card.lateFeeMonths.length;
  events.push(emit(s, 'statement', { balance: card.statementBalance, minimumDue: card.minimumDue }));
  return { state, events };
}

export function paymentOptions(s) {
  const balance = s.card.balance;
  const midpoint = Math.min(balance, Math.round((s.card.minimumDue + balance) / 2));
  return [
    { id: 'full', label: 'Pay in full', amount: balance },
    { id: 'minimum', label: 'Pay the minimum', amount: Math.min(balance, s.card.minimumDue) },
    { id: 'custom', label: 'Choose an amount', amount: midpoint },
    { id: 'none', label: balance ? 'Skip this payment' : 'Close empty statement', amount: 0 },
  ].map(option => ({ ...option, disabled: option.id !== 'custom' && option.amount > s.cash,
    detail: option.id === 'custom' ? 'Enter an amount up to your cash and card balance.' : option.amount > s.cash ? 'Not enough cash in checking.' : option.id === 'none' && balance ? 'An unpaid minimum triggers this game’s late rules.' : 'Paid from checking.' }));
}

export function applyPayment(s, amount) {
  if (!validMoney(amount) || amount > s.cash || amount > s.card.balance) throw new RangeError('Payment must fit checking and outstanding balance.');
  const state = copy(s), card = state.card, events = [];
  const full = amount === card.balance;
  const meetsMinimum = amount >= card.minimumDue;
  state.cash -= amount;
  card.balance -= amount;
  if (amount) events.push(emit(s, 'payment', { amount, kind: full ? 'full' : amount === card.minimumDue ? 'minimum' : 'custom' }));
  if (full || meetsMinimum) {
    card.daysPastDue = 0;
    card.onTimeStreak++;
    if (full && !card.graceActive) events.push(emit(s, 'grace_restored'));
    if (!full && card.graceActive) events.push(emit(s, 'grace_lost'));
    card.graceActive = full;
    if (card.penaltyActive && card.onTimeStreak >= 6) {
      card.penaltyActive = false;
      events.push(emit(s, 'penalty_apr_off', { rate: card.apr }));
    }
  } else {
    if (card.graceActive) events.push(emit(s, 'grace_lost'));
    card.graceActive = false;
    card.daysPastDue += 30;
    card.onTimeStreak = 0;
    const priorFees = card.lateFeeMonths.filter(month => s.month - month < 6);
    const fee = priorFees.length ? REPEAT_LATE_FEE : FIRST_LATE_FEE;
    card.lateFeeMonths = [...priorFees, s.month];
    card.lateFeesLast6 = card.lateFeeMonths.length;
    card.balance += fee;
    card.feesPaid += fee; // Cumulative fees charged, not necessarily repaid.
    card.feesSinceStatement = (card.feesSinceStatement || 0) + fee;
    events.push(emit(s, 'missed_payment', { daysPastDue: card.daysPastDue }), emit(s, 'late_fee', { amount: fee }));
    if ([30, 60, 90].includes(card.daysPastDue)) {
      card.lateMarks.push({ month: s.month, days: card.daysPastDue });
      events.push(emit(s, 'late_mark', { days: card.daysPastDue }));
    } else if (card.daysPastDue > 90) {
      // Keep the current delinquency episode current, without adding a new
      // severe penalty each month. Its aging clock starts after it is cured.
      const index = card.lateMarks.findLastIndex(mark => mark.days === 90);
      if (index >= 0) card.lateMarks[index] = { month: s.month, days: 90 };
      else card.lateMarks.push({ month: s.month, days: 90 });
      events.push(emit(s, 'late_mark', { days: 90, refreshed: true }));
    }
    if (card.daysPastDue >= 60 && !card.penaltyActive) {
      card.penaltyActive = true;
      events.push(emit(s, 'penalty_apr_on', { rate: card.penaltyApr }));
    }
  }
  return { state, events };
}

export function policyPayment(s) {
  const amounts = { full: s.card.balance, minimum: s.card.minimumDue, fixed: s.fixedPayment, none: 0 };
  const target = amounts[s.paymentPolicy];
  if (!validMoney(target)) throw new RangeError('Unknown payment policy or invalid fixed payment.');
  return applyPayment(s, Math.min(target, s.cash, s.card.balance));
}
