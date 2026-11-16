import { charge, closeStatement, applyPayment, paymentOptions, policyPayment } from './card.mjs';
import { updateScore } from './credit.mjs';
import { eligibleEvents, buildEvent, applyEventChoice } from './events.mjs';
import { rng, pickWeighted } from './rng.mjs';
import { narrate } from './narrate.mjs';
const END_MONTH = 72;
const annotate = (events, month) => events.map(e => ({ ...e, month: e.month ?? month }));
const finish = (state, events) => ({ state: { ...state, log: [...state.log, ...narrate(events, state)] }, events });
function apply(result, events, month) {
  events.push(...annotate(result.events, month));
  return result.state;
}
function closeCycle(state, events) {
  let s = state;
  s = apply(updateScore(s), events, s.month);
  s = { ...s, month: s.month + 1, pending: null, stepStage: null };
  s.phase = s.month >= END_MONTH ? 'ended' : s.month >= 12 ? 'yearly' : 'monthly';
  return s;
}
function statement(state, events) {
  let s = apply(closeStatement(state), events, state.month);
  if (s.phase === 'monthly') {
    return { ...s, stepStage: 'payment', pending: { eventId: 'payment', kind: 'payment', tag: 'CARD STATEMENT', title: 'Your monthly statement is ready.', description: 'Choose a payment by this cycle’s deadline. The game compresses a billing and payment cycle into one month.', options: paymentOptions(s) } };
  }
  s = apply(policyPayment(s), events, s.month);
  return closeCycle(s, events);
}
function startCycle(state, events) {
  let s = { ...state, cash: state.cash + state.income.monthly };
  events.push({ type: 'payday', month: s.month, amount: s.income.monthly });
  const paidBills = Math.min(s.cash, s.expenses.monthly);
  const shortfall = s.expenses.monthly - paidBills;
  s = { ...s, cash: s.cash - paidBills, billsArrears: (s.billsArrears || 0) + shortfall };
  events.push({ type: 'bills', month: s.month, amount: paidBills });
  if (shortfall) events.push({ type: 'bills_shortfall', month: s.month, amount: shortfall });
  s = apply(charge(s, s.spending.monthly, 'regular monthly card spending'), events, s.month);
  let selected;
  const eligible = eligibleEvents(s);
  if (s.annual) {
    const planned = s.annual.plan.find(item => item.month === s.month);
    selected = planned && eligible.find(e => e.id === planned.id);
  } else {
    selected = eligible.find(e => e.scheduledMonth === s.month);
    if (!selected && s.month >= 6) {
      const roll = rng(s); s = roll.state;
      if (roll.value < .35) {
        const picked = pickWeighted(s, eligible.filter(e => e.scheduledMonth === undefined));
        selected = picked.value; s = picked.state;
      }
    }
  }
  if (selected) return { ...s, stepStage: 'life', pending: buildEvent(s, selected.id) };
  return statement(s, events);
}
function runYear(state, events) {
  let s = state;
  while (s.annual && s.month < s.annual.target && !s.pending && s.phase !== 'ended') s = startCycle(s, events);
  if (s.annual && !s.pending && (s.month >= s.annual.target || s.phase === 'ended')) {
    const a = s.annual;
    events.push({ type: 'year_summary', month: s.month, age: s.startAge + Math.floor(s.month / 12), policy: s.paymentPolicy, interest: s.card.interestPaid - a.interestFrom, fees: s.card.feesPaid - a.feesFrom, balanceFrom: a.balanceFrom, balanceTo: s.card.balance, scoreFrom: a.scoreFrom, scoreTo: s.credit.score });
    s = { ...s, annual: null };
  }
  return s;
}
export function advanceMonth(state) {
  if (state.pending || state.phase !== 'monthly') return { state, events: [] };
  const events = [];
  return finish(startCycle(state, events), events);
}
export function advanceYear(state) {
  if (state.pending || state.phase !== 'yearly') return { state, events: [] };
  const events = [];
  let s = state;
  if (!s.annual) {
    const candidates = eligibleEvents(s).filter(e => e.scheduledMonth === undefined).sort((a, b) => b.weight - a.weight);
    const chosen = candidates.slice(0, 2);
    s = { ...s, annual: { target: Math.min(END_MONTH, s.month + 12), interestFrom: s.card.interestPaid, feesFrom: s.card.feesPaid, balanceFrom: s.card.balance, scoreFrom: s.credit.score, plan: chosen.map((e, i) => ({ id: e.id, month: s.month + i * 6 })) } };
  }
  return finish(runYear(s, events), events);
}
export function resolveChoice(state, index, customAmount) {
  if (!state.pending || !Number.isInteger(index)) return { state, events: [] };
  const selected = state.pending.options[index];
  if (!selected || selected.disabled) return { state, events: [] };
  const events = [];
  let s = { ...state, pending: null };
  if (state.pending.kind === 'life') {
    s = apply(applyEventChoice(s, state.pending.eventId, index), events, s.month);
    s = statement(s, events);
  } else {
    const amount = selected.id === 'custom' ? customAmount ?? Math.min(selected.amount, s.cash, s.card.balance) : selected.amount;
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > s.cash || amount > s.card.balance) return { state, events: [] };
    events.push({ type: 'choice_made', month: s.month, eventId: 'payment', choiceId: selected.id, label: selected.label });
    s = apply(applyPayment(s, amount), events, s.month);
    s = closeCycle(s, events);
  }
  if (s.annual && !s.pending) s = runYear(s, events);
  return finish(s, events);
}
