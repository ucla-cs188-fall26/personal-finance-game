// Money is stored in cents. Each statement represents one billing cycle.
export const APR = 0.24;
export const LIMIT = 100_000;
export const minimum = balance => Math.min(3500, balance);
export const money = cents => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0,
}).format(cents / 100);

export const chapters = [
  'Laptop trouble', 'First statement', 'Bike repair', 'Campus job',
  'Second statement', 'Call home', 'Final statement',
];

export const newRun = () => ({ cash: 72000, balance: 0, interest: 0, aid: 0, history: [] });

const choice = (label, detail, delta, story) => ({ label, detail, delta, story });

function payment(s) {
  const { cash, balance } = s;
  if (!balance) return {
    tag: 'CARD STATEMENT', title: 'Nothing due this month',
    description: 'Your statement shows a $0 balance. You can close this billing cycle without a payment.',
    options: [choice('Close the statement', 'No payment or interest', {}, 'Your card statement closed at $0.')],
  };
  const min = minimum(balance);
  const amounts = [
    ['Pay the statement in full', balance],
    ['Pay half the statement', Math.ceil(balance / 2)],
    ['Pay the minimum', min],
  ].filter(([, amount], i) => i !== 1 || (amount > min && amount < balance))
    .filter(([, amount], i) => i === 0 || amount !== balance);
  return {
    tag: 'CARD STATEMENT', title: 'Your card payment is due',
    description: `Your statement balance is ${money(balance)}. The minimum due is ${money(min)}. Your card has a 24% APR, and you have ${money(cash)} in checking.`,
    options: amounts.map(([label, amount]) => {
      const interest = Math.round((balance - amount) * APR / 12);
      return {
        ...choice(label, `${money(amount)} from checking`, { cash: -amount, balance: interest - amount, interest },
          interest ? `You paid ${money(amount)}. The unpaid ${money(balance - amount)} accrued ${money(interest)} in interest, leaving ${money(balance - amount + interest)} on the card.`
            : `You paid the ${money(amount)} statement in full. No balance carried forward, so the game added no interest.`),
        disabled: cash < amount,
      };
    }),
  };
}

export function eventFor(s) {
  switch (s.history.length) {
    case 0: return {
      tag: 'CAMPUS LIFE', title: 'Your laptop just quit.',
      description: 'It’s your second year of college, and your laptop won’t turn on. Midterms start Monday. You have $720 in checking and a brand-new credit card. How do you replace it?',
      options: [
        choice('Buy new on credit', '$600 on your card', { balance: 60000 }, 'You bought a new laptop. The $600 charge will show up on your first statement.'),
        choice('Buy refurbished on credit', '$340 on your card', { balance: 34000 }, 'You bought a refurbished laptop. You kept more room on the card, but still owe $340.'),
        choice('Buy refurbished with debit', '$340 from checking', { cash: -34000 }, 'You paid $340 upfront. You have less cash on hand, but no card bill for the laptop.'),
      ],
    };
    case 1: case 4: case 6: return payment(s);
    case 2: return {
      tag: 'UNEXPECTED EXPENSE', title: 'Your bike needs a repair.',
      description: 'Your rear wheel bends on the way to class. The shop quotes $120. You can pay for a quick fix or take the bus for the rest of the term.',
      options: [
        choice('Fix it with cash', '$120 from checking', { cash: -12000 }, 'You fixed the bike with cash and kept the repair off your card.'),
        choice('Put the repair on your card', '$120 on your card', { balance: 12000 }, 'The shop fixed your bike. The $120 charge will be part of your next statement.'),
        choice('Take the bus', '$40 for a term pass', { cash: -4000 }, 'You bought a $40 bus pass and set aside the bike for the term.'),
      ].map(option => ({ ...option, disabled: s.cash + (option.delta.cash ?? 0) < 0 || s.balance + (option.delta.balance ?? 0) > LIMIT })),
    };
    case 3: return {
      tag: 'CAMPUS JOB', title: 'The library is hiring.',
      description: 'You can pick up extra shifts before the next statement. More shifts mean more cash, but less time to study and see friends.',
      options: [
        choice('Take extra shifts', '+$260 take-home pay', { cash: 26000 }, 'You worked extra shifts and took home $260. Your study group met without you twice.'),
        choice('Take one weekly shift', '+$100 take-home pay', { cash: 10000 }, 'You earned $100 and kept your usual study schedule.'),
      ],
    };
    case 5: {
      const help = Math.min(20000, s.balance);
      return {
        tag: 'FAMILY CHECK-IN', title: 'Dad calls to check in.',
        description: help ? `You still owe ${money(s.balance)}. Dad offers to send up to $200 toward the bill if you need it. Do you take the help?`
          : 'You’ve cleared your card balance. Dad asks how managing your own expenses has been going.',
        options: help ? [
          choice('Accept help with the bill', `+${money(help)} to checking`, { cash: help, aid: help }, 'Dad sent money to checking. You still need to make the card payment.'),
          choice('Handle the bill yourself', 'Keep your finances independent', {}, 'You thanked Dad and decided to handle the next payment yourself.'),
        ] : [
          choice('Tell him how it went', 'Your card balance is $0', {}, 'You told Dad how you paid for the laptop and kept your card balance clear.'),
        ],
      };
    }
    default: return null;
  }
}

export function decide(s, index) {
  const event = eventFor(s);
  const option = event?.options[index];
  if (!option || option.disabled) return s;
  const next = { ...s };
  for (const [key, amount] of Object.entries(option.delta)) next[key] += amount;
  next.history = [...s.history, { label: option.label, story: option.story, delta: option.delta }];
  return next;
}

export const quizzes = {
  before: [
    ['A statement shows $500 due and a $35 minimum. You pay $35 on time. What happens to the rest?', ['It carries forward and can accrue interest.', 'The issuer forgives it.', 'It only counts if you use the card again.'], 0],
    ['Your card has a purchase grace period and you carry no prior balance. What avoids purchase interest?', ['Pay any amount by the due date.', 'Pay the full statement by the due date.', 'Pay the minimum by the due date.'], 1],
    ['Two people carry the same balance at the same rate. Who generally pays less interest?', ['The one who pays only the minimum.', 'They pay the same either way.', 'The one who pays more toward the balance sooner.'], 2],
  ],
  after: [
    ['You pay $40 on time on a $400 statement. What can happen to the remaining $360?', ['It disappears once the minimum is met.', 'It carries over and can earn the issuer interest.', 'It becomes a new credit limit.'], 1],
    ['You have a purchase grace period and no prior balance. How do you keep your new purchase interest-free?', ['Pay the full statement by the due date.', 'Wait until the following statement.', 'Pay the minimum by the due date.'], 0],
    ['You can afford to send $150 or $35 toward a carried balance today. Which generally reduces future interest more?', ['$35, because it’s the minimum.', 'Neither; APR fixes the dollar cost.', '$150, because less balance remains.'], 2],
  ],
};
