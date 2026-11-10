import { money } from './engine.mjs';
const savings = ['CFPB · Emergency savings guide', 'https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/'];
const interest = ['CFPB · How interest works', 'https://www.consumerfinance.gov/ask-cfpb/how-does-my-credit-card-company-calculate-the-amount-of-interest-i-owe-en-51/'];
const grace = ['CFPB · Grace periods', 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-grace-period-for-a-credit-card-en-47/'];
const fed = ['Federal Reserve · 2025 survey, published May 2026', 'https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-savings-investments.htm'];
export function lessonFor(run, index = run.history.length - 1) {
  const item = run.history[index];
  if (!item) return null;
  const delta = item.delta;
  if ([1, 4, 6].includes(index)) {
    const paid = -(delta.cash || 0);
    const charged = delta.interest || 0;
    return {
      skill: 'Read a statement', title: charged ? 'The minimum isn’t the price tag.' : 'Paid off is a different thing from paid on time.',
      why: charged ? `You paid ${money(paid)}, but ${money(charged)} of interest was added. Your debt fell by only ${money(paid - charged)}. A smaller payment preserves cash today while leaving more debt for later.` : 'This cycle added no interest in the game. In real life, avoiding purchase interest generally requires an available grace period and paying the full statement by its due date. Carrying a balance can remove that grace period.',
      action: 'Find three fields on a statement: statement balance, minimum due, and due date. Check your checking balance before setting a payment.',
      fact: charged ? 'Many issuers calculate interest daily. When interest applies, paying earlier can reduce the cost.' : 'Most cards offer a purchase grace period, but issuers are not required to offer one.',
      source: charged ? interest : grace,
      question: 'Practice: leave $200 unpaid at this game’s 2% monthly rate. How much interest gets added?',
      answers: ['$2', '$4', '$40'], correct: 1,
      explanation: '$200 × 0.02 = $4. The next balance becomes $204 before any new activity. Real cards often use daily balances; this is the game’s simplified model.',
      ...(index === 4 ? {
        question: 'A $500 balance is due. Compare paying $35 with paying $100. Which leaves less balance to accrue interest?',
        answers: ['Paying $35', 'Paying $100', 'They leave the same balance'], correct: 1,
        explanation: 'Before interest, paying $35 leaves $465; paying $100 leaves $400. At the game’s 2% rate, interest is $9.30 versus $8. You also need enough cash for essentials.',
      } : index === 6 ? {
        question: 'On a real card with a purchase grace period and no prior balance, what generally avoids purchase interest?',
        answers: ['Paying the minimum', 'Paying half', 'Paying the full statement by its due date'], correct: 2,
        explanation: 'The full statement by the due date generally preserves the grace period. Check your card terms: carrying balances can remove it, and cash advances often work differently.',
      } : {}),
    };
  }
  if (index === 0) return {
    skill: 'Compare total cost', title: delta.balance ? 'Available credit isn’t extra income.' : 'Cash avoids borrowing, but uses your buffer.',
    why: delta.balance ? `Your checking balance stayed the same, but you now owe ${money(delta.balance)}. Paying later changes the timing, not the price. Interest can make that price grow.` : 'You paid $340 today. That avoids laptop debt but leaves $380 in checking for everything that comes next.',
    action: 'Before buying, compare the price, repayment plan, and cash left for essentials. The $340 laptop costs $260 less than the $600 one before interest.',
    fact: 'Purchase interest can be avoided with a grace period when you carry no prior balance and pay the full statement on time.', source: grace,
    question: 'A $600 card purchase leaves $720 in checking. How much is left after reserving the $600 to repay it?', answers: ['$720', '$1,320', '$120'], correct: 2,
    explanation: '$720 − $600 = $120. Your bank balance alone can hide bills you already owe.',
  };
  if (index === 2) return {
    skill: 'Build a buffer', title: delta.balance ? 'A surprise bill can become a longer bill.' : 'You found a way through the unexpected.',
    why: delta.balance ? 'The repair is done, but its $120 cost moves to your next statement. An emergency cash reserve can help keep a repair from becoming ongoing debt.' : `You used ${money(-delta.cash)} for transport. Choosing the bus costs $80 less than the repair this term, with a different time and convenience tradeoff.`,
    action: 'Pick a small emergency savings target based on a plausible surprise expense. Build it gradually when essentials and required payments are covered.',
    fact: 'In the 2025 Federal Reserve survey, 63% of U.S. adults said they would cover a hypothetical $400 emergency using cash, savings, or a card paid off at the next statement. This does not mean the other 37% could not pay at all.', source: fed,
    question: 'You set aside $20 from each weekly paycheck. How long to build a $120 repair fund?', answers: ['6 weeks', '12 weeks', '2 weeks'], correct: 0,
    explanation: '$120 ÷ $20 = 6 weekly deposits, assuming no withdrawals. A small repeated amount can fund a specific goal.',
  };
  if (index === 3) return {
    skill: 'Plan a paycheck', title: 'Give the next paycheck a job.',
    why: `You brought home ${money(delta.cash)}. Extra work brings more cash but uses time you could spend studying or resting. A useful budget accounts for both.`,
    action: 'List bills due before the next payday, then decide what you can save or spend. Use take-home pay, rather than the larger amount before deductions.',
    fact: 'Cash flow includes when income arrives and when expenses leave. Even a budget that balances overall can run short if a bill comes before payday.', source: savings,
    question: 'A $100 paycheck arrives. You reserve $35 for a card payment and $20 for savings. What remains?', answers: ['$65', '$45', '$80'], correct: 1,
    explanation: '$100 − $35 − $20 = $45 for other needs. This is a practice budget, not an instruction to save before paying essentials.',
  };
  return {
    skill: 'Make a repayment plan', title: delta.aid ? 'Help changes your cash, not your card statement.' : 'A plan matters more than doing it alone.',
    why: delta.aid ? `The ${money(delta.aid)} gift went into checking. Your card balance only falls when you send a payment. There is no penalty here for accepting help.` : 'Whether you ask for help or handle it yourself, identify the amount due, the payment date, and the money available to cover it.',
    action: 'If someone offers support, clarify whether it is a gift or a loan and agree on any repayment expectations. In this story, Dad’s help is a gift.',
    fact: 'In 2025, 55% of U.S. adults reported having savings set aside for three months of expenses, according to the Federal Reserve. Financial buffers vary widely.', source: fed,
    question: 'A $200 gift arrives in checking while you owe $300 on a card. What is the card balance before you make a payment?', answers: ['$100', '$0', '$300'], correct: 2,
    explanation: 'It is still $300. Receiving money and paying a creditor are separate actions.',
  };
}
