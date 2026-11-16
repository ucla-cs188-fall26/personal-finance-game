// Educational score model. FICO's actual score formula is proprietary.
export const FACTOR_WEIGHTS = { payment: .35, amounts: .30, age: .15, newCredit: .10, mix: .10 };
const clamp = value => Math.max(0, Math.min(1, value));
export function creditFactors(s) {
  const c = s.card;
  const penalty = c.lateMarks.reduce((sum, mark) => sum + ({ 30: .35, 60: .5, 90: .7 }[mark.days] || .7) * clamp(1 - (s.month - mark.month) / 84), 0);
  const utilization = c.limit > 0 ? c.statementBalance / c.limit : c.statementBalance ? 1 : 0;
  return {
    // Aging historical marks must not reward an account that remains severely
    // delinquent. Recovery starts only once its required payment is met.
    payment: c.daysPastDue >= 90 ? 0 : clamp(1 - penalty),
    amounts: utilization <= .09 ? 1 : utilization <= .29 ? .85 : utilization <= .49 ? .6 : utilization <= .74 ? .4 : .2,
    age: clamp(c.monthsOpen / 60),
    newCredit: clamp(1 - .15 * c.inquiries.filter(month => month <= s.month && s.month - month < 12).length),
    mix: s.flags?.hasLoan ? .8 : .5,
  };
}
export const targetScore = s => Math.round(300 + 550 * Object.entries(creditFactors(s)).reduce((sum, [key, value]) => sum + FACTOR_WEIGHTS[key] * value, 0));
export function updateScore(s) {
  const factors = creditFactors(s), previous = s.credit.score;
  const target = targetScore(s);
  const score = s.card.monthsOpen < 6 ? null : previous == null ? target : target < previous ? target : Math.min(target, previous + Math.ceil((target - previous) / 4));
  const state = { ...s, credit: { ...s.credit, score, factors, history: [...s.credit.history, { month: s.month, score }] } };
  const events = [];
  if (score != null && previous == null) events.push({ type: 'score_first', month: s.month, score });
  else if (score != null && score !== previous) {
    const old = s.credit.factors || factors;
    const reasons = Object.entries(factors).map(([key, value]) => ({ key, change: (value - old[key]) * FACTOR_WEIGHTS[key] })).filter(item => item.change !== 0).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 2).map(item => item.key);
    events.push({ type: 'score_change', month: s.month, from: previous, to: score, reasons: reasons.length ? reasons : ['recovery'] });
  }
  return { state, events };
}
export function band(score) {
  if (score == null) return 'No score yet';
  return score < 580 ? 'Poor' : score < 670 ? 'Fair' : score < 740 ? 'Good' : score < 800 ? 'Very good' : 'Exceptional';
}
