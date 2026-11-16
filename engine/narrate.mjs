const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
// Wording is selected deterministically without advancing the gameplay RNG.
const variant = (event, state, choices) => choices[((event.month ?? state.month) + (state.rngSeed >>> 0)) % choices.length];
export function narrate(events, state) {
  return events.map(event => {
    const e = event;
    let icon = '•', tone = 'neutral', text = '';
    switch (e.type) {
      case 'payday': icon = '💵'; tone = 'good'; text = variant(e, state, [`Your take-home pay arrived: ${money(e.amount)}.`, `${money(e.amount)} landed in checking from work.`, `Payday added ${money(e.amount)} to your cash.`]); break;
      case 'bills': icon = '🏠'; text = variant(e, state, [`You paid ${money(e.amount)} for regular living costs.`, `Rent, food, and phone took ${money(e.amount)} from checking.`]); break;
      case 'bills_shortfall': icon = '⚠️'; tone = 'bad'; text = `${money(e.amount)} of living costs went unpaid and remains in bill arrears.`; break;
      case 'purchase': icon = e.method === 'cash' ? '🛍️' : '💳'; text = `${e.what}: ${money(e.amount)} ${e.method === 'cash' ? 'paid from checking' : 'charged to your card'}.`; break;
      case 'declined': icon = '⛔'; tone = 'bad'; text = `${e.what}: the ${money(e.amount)} purchase was declined. Your available money or credit could not cover it.`; break;
      case 'statement': icon = '📬'; text = `Statement: ${money(e.balance)} balance; ${money(e.minimumDue)} minimum due.`; break;
      case 'payment': icon = '✅'; tone = 'good'; text = `You paid ${money(e.amount)} ${e.kind === 'full' ? 'and cleared the card' : e.kind === 'minimum' ? 'toward the minimum due' : 'toward your card'}.`; break;
      case 'missed_payment': icon = '⌛'; tone = 'bad'; text = `You did not cover the minimum. The game now records ${e.daysPastDue} days past due.`; break;
      case 'interest': icon = '📈'; tone = 'bad'; text = `${money(e.amount)} interest was added at ${(e.rate * 100).toFixed(2)}% APR.`; break;
      case 'late_fee': icon = '🧾'; tone = 'bad'; text = `A ${money(e.amount)} late fee was added to your card.`; break;
      case 'late_mark': icon = '🔻'; tone = 'bad'; text = `A ${e.days}-day late mark entered your simulated credit history.`; break;
      case 'penalty_apr_on': icon = '🚨'; tone = 'bad'; text = `Your fictional card's penalty APR activated: ${(e.rate * 100).toFixed(2)}%.`; break;
      case 'penalty_apr_off': icon = '🌤️'; tone = 'good'; text = `Six on-time cycles restored your regular ${(e.rate * 100).toFixed(0)}% APR under the game's rule.`; break;
      case 'grace_lost': icon = '💡'; tone = 'bad'; text = 'You carried a balance. The next cycle loses its purchase grace period in this model.'; break;
      case 'grace_restored': icon = '✨'; tone = 'good'; text = 'Paying in full restored your purchase grace period in this model.'; break;
      case 'score_first': icon = '🌱'; tone = 'good'; text = `Your first simulated credit score: ${e.score}. You now have six cycles of history.`; break;
      case 'score_change': icon = e.to >= e.from ? '📈' : '📉'; tone = e.to >= e.from ? 'good' : 'bad'; text = `Score ${e.to >= e.from ? '▲' : '▼'}${Math.abs(e.to - e.from)} → ${e.to}. ${(e.reasons || []).join('; ')}.`; break;
      case 'choice_made': icon = '🎯'; text = `You chose: ${e.label}.`; break;
      case 'year_summary': icon = '🎂'; text = `Age ${e.age}: your ${e.policy} plan added ${money(e.interest)} interest and ${money(e.fees || 0)} fees this year. Card balance: ${money(e.balanceFrom)} → ${money(e.balanceTo)}. Score: ${e.scoreFrom ?? 'not yet available'} → ${e.scoreTo ?? 'not yet available'}.`; break;
      case 'gift': icon = '🎁'; tone = 'good'; text = `${e.what} added ${money(e.amount)} to checking.`; break;
      case 'income_change': icon = '📚'; tone = 'good'; text = `Your monthly take-home pay increased by ${money(e.amount)}.`; break;
      case 'inquiry': icon = '🔎'; text = 'Your application added a hard inquiry to simulated credit history.'; break;
      case 'career': icon = '🎓'; tone = 'good'; text = e.what; break;
      case 'savings_transfer': icon = '🛟'; tone = 'good'; text = e.amount >= 0 ? `You moved ${money(e.amount)} into emergency savings.` : `You moved ${money(-e.amount)} from savings back into checking.`; break;
      default: text = e.type.replaceAll('_', ' ');
    }
    return { ...event, month: event.month ?? state.month, icon, text, tone };
  });
}
