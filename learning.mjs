const sources = {
  grace: ['CFPB · Grace periods', 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-grace-period-for-a-credit-card-en-47/'],
  interest: ['CFPB · Credit card interest', 'https://www.consumerfinance.gov/ask-cfpb/how-does-my-credit-card-company-calculate-the-amount-of-interest-i-owe-en-51/'],
  saving: ['CFPB · Emergency savings', 'https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/'],
  fed: ['Federal Reserve · 2025 survey, May 2026', 'https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-savings-investments.htm'],
};
const lessons = {
  laptop: ['Compare total cost', 'Credit changes when you pay, not what you owe.', 'A purchase leaves a bill even if the money is still in checking. Keep enough cash for essentials and the next card payment.', 'Before buying, compare the price, your repayment plan, and money left for essentials.', 'grace'],
  bike_repair: ['Build a cash buffer', 'An unexpected repair should not become a long-running bill.', 'Paying cash uses your buffer; credit preserves cash now but may add interest later. A cheaper alternative can buy you time.', 'Start an emergency fund with a realistic small target and regular contributions.', 'fed'],
  campus_job: ['Budget your paycheck', 'More income creates options—and costs time.', 'Work can help cover the next bill. Budget from take-home pay and account for study time and rest.', 'List bills due before the next payday before choosing what to spend or save.', 'saving'],
  call_home: ['Plan a repayment', 'Accepting help and paying a bill are separate steps.', 'A gift changes checking, not the balance owed. You still need to make the payment. Asking for help is a legitimate option.', 'Clarify whether support is a gift or a loan and agree on expectations.', 'saving'],
  grace_lost: ['Understand the grace period', 'Paying on time does not always mean interest-free.', 'Leaving part of the statement unpaid ends the grace period in this model. The next cycle charges interest. Actual card agreements may use different timing.', 'Look for the full statement balance and due date, not just the minimum.', 'grace'],
  grace_restored: ['Restore your buffer', 'Your card is paid off.', 'In the game, paying in full restores the grace period immediately. A real card may require more than one fully paid cycle and may have trailing interest.', 'Read the grace-period section of your own card agreement.', 'grace'],
  late_fee: ['Avoid late costs', 'A missed minimum adds a second cost.', 'The game adds a fee as well as possible interest. The fictional card uses $30 for the first late fee and $41 for another within six cycles. These are game terms, not universal legal limits.', 'Use a due-date reminder, and check your bank balance before enabling automatic payments.', 'interest'],
  late_mark: ['Protect payment history', 'Late payments can outlast the bill.', 'This model records a late mark at 30, 60, and 90 days past due. Its credit penalty fades over seven years. Exact reporting and scoring in real life vary.', 'If you cannot pay, contact the issuer before the due date to ask about available options.', 'interest'],
  penalty_apr_on: ['Understand borrowing costs', 'Your simulated borrowing rate just increased.', 'After 60 days past due this card switches to 29.99% APR. In this game six consecutive on-time payments turn it off; this is a simplified rule.', 'Read penalty-rate terms and prioritize a sustainable on-time payment plan.', 'interest'],
  score_first: ['Read credit factors', 'A score is a summary, not a measure of your worth.', 'The game can estimate a score after six cycles. Its weighted factors illustrate payment history, borrowing, account age, new credit, and mix. It does not predict your actual FICO score.', 'Open Stats to see which factors affect this simulated score.', 'saving'],
  payment: ['Compare payment plans', 'The minimum is a requirement, not a payoff plan.', 'Paying more generally leaves less debt to accrue interest. Balance that with enough cash for necessities. Paying in full while a grace period applies avoids purchase interest.', 'Compare the full statement balance with your budget before choosing a payment amount.', 'interest'],
};
const checks = {
  payment: ['In a simplified 2% monthly model, what interest does $200 accrue?', ['$2', '$4', '$40'], 1, '$200 × 0.02 = $4. Actual cards often use daily balances.'],
  saving: ['You put away $20 each week. When will you have $120?', ['6 weeks', '12 weeks', '2 weeks'], 0, '$120 ÷ $20 = 6 deposits, assuming no withdrawals.'],
};
export function lessonFor(eventId, outcome = {}) {
  const sourceEvent = lessons[eventId] ? eventId : outcome.kind === 'payment' ? 'payment' : null;
  const row = lessons[sourceEvent] || ['Plan for your next bill', 'Every choice changes your future options.', 'Compare the cost today with the cash and commitments you will have next month. Borrowed money still needs a repayment plan.', 'Set aside money for required bills before deciding what is available to spend.', 'saving'];
  const [skill, title, why, action, sourceKey] = row;
  const [question, answers, correct, explanation] = checks[['payment','grace_lost','late_fee','penalty_apr_on'].includes(sourceEvent) ? 'payment' : 'saving'];
  return { skill, title, why, action, source: sources[sourceKey], fact: sourceKey === 'fed' ? 'In the 2025 Federal Reserve survey, 63% of U.S. adults said they would cover a hypothetical $400 emergency using cash, savings, or a card paid in full at the next statement. This does not mean the other 37% could not pay at all.' : '', question, answers, correct, explanation };
}
