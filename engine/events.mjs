import { charge } from './card.mjs';
const age = s => s.startAge + Math.floor(s.month / 12);
const dollars = value => `$${(value / 100).toFixed(value % 100 ? 2 : 0)}`;
const noChange = s => ({ state: s, events: [] });
const option = (id, label, detail, apply = noChange, disabled = false) => ({ id, label, detail, apply, disabled });
const cash = (s, amount, what) => amount > s.cash ? { state: s, events: [{ type: 'declined', amount, what }] } : { state: { ...s, cash: s.cash - amount }, events: [{ type: 'purchase', amount, what, method: 'cash' }] };
const grant = (s, amount, what) => ({ state: { ...s, cash: s.cash + amount }, events: [{ type: 'gift', amount, what }] });
const cashOption = (s, amount, what, label = 'Pay from checking') => option('cash', label, `${dollars(amount)} from checking${amount > s.cash ? ' · Not enough cash' : ''}`, x => cash(x, amount, what), amount > s.cash);
const cardOption = (s, amount, what) => option('card', 'Use the credit card', `${dollars(amount)} on credit${s.card.balance + amount > s.card.limit ? ' · Credit limit exceeded' : ''}`, x => charge(x, amount, what), s.card.balance + amount > s.card.limit);
const purchaseEvent = (id, title, description, amount, when, weight = 2) => ({ id, when, weight, once: true, build: s => ({ tag: 'LIFE HAPPENS', title, description, options: [cashOption(s, amount, title), cardOption(s, amount, title), option('wait', 'Find a free alternative for now', 'Keep your cash; accept the inconvenience')] }) });
export const eventDeck = [
  { id: 'laptop', scheduledMonth: 0, once: true, weight: 10, when: () => true, build: s => ({ tag: 'CAMPUS LIFE', title: 'Your laptop just quit.', description: 'Midterms are next week. A new laptop costs $600; a refurbished one costs $340. Choose a plan for replacing it.', options: [
    { ...cardOption(s, 60000, 'new laptop'), id: 'new', label: 'Buy new on credit' },
    { ...cardOption(s, 34000, 'refurbished laptop'), id: 'refurbished', label: 'Buy refurbished on credit' },
    cashOption(s, 34000, 'refurbished laptop', 'Buy refurbished with debit'),
    option('borrow', 'Borrow a campus laptop', 'Free for the term; limited availability'),
  ] }) },
  { ...purchaseEvent('bike_repair', 'Your bike needs a repair.', 'The shop quotes $120. You could take the bus for the rest of term for $40 instead.', 12000, () => true, 8), scheduledMonth: 2, build: s => ({ tag: 'SURPRISE EXPENSE', title: 'Your bike needs a repair.', description: 'Repair it for $120, or take a slower bus route for the term.', options: [cashOption(s, 12000, 'bike repair'), cardOption(s, 12000, 'bike repair'), cashOption(s, 4000, 'bus pass', 'Buy a $40 bus pass'), option('walk', 'Walk and borrow rides', 'Free, but takes more time')] }) },
  { id: 'campus_job', scheduledMonth: 3, once: true, weight: 8, when: () => true, build: () => ({ tag: 'WORK', title: 'The library is hiring.', description: 'Your current $900 monthly take-home income covers most basics. A campus shift can add reliable income, at a cost to your free time.', options: [
    option('extra', 'Work extra shifts', '+$100 monthly take-home · less free time', s => ({ state: { ...s, income: { monthly: s.income.monthly + 10000 }, flags: { ...s.flags, campusJob: true, busy: true } }, events: [{ type: 'income_change', amount: 10000 }] })),
    option('light', 'Take one weekly shift', '+$50 monthly take-home', s => ({ state: { ...s, income: { monthly: s.income.monthly + 5000 }, flags: { ...s.flags, campusJob: true } }, events: [{ type: 'income_change', amount: 5000 }] })),
    option('study', 'Keep your study time', 'No change in income'),
  ] }) },
  { id: 'call_home', scheduledMonth: 5, once: true, weight: 7, when: () => true, build: s => ({ tag: 'FAMILY', title: 'Dad checks in.', description: s.card.balance ? 'Dad offers a gift of up to $200 toward your card. Accepting help is a choice, not a failure.' : 'Your card is clear. Dad asks what you have learned about managing money.', options: s.card.balance ? [
    option('help', 'Accept the gift', `${dollars(Math.min(20000, s.card.balance))} into checking; you still make the payment`, x => grant(x, Math.min(20000, x.card.balance), 'family support')),
    option('independent', 'Make your own repayment plan', 'No change in cash'),
  ] : [option('share', 'Share what you learned', 'Keep building the habit')] }) },
  purchaseEvent('phone_screen', 'A cracked phone screen.', 'The screen repair costs $90. You can use it carefully for now if the repair does not fit your budget.', 9000, s => s.month >= 6),
  purchaseEvent('birthday_trip', 'Your friends plan a weekend away.', 'Your share would be $180. A local celebration costs less, but you would miss the trip.', 18000, s => s.month >= 6),
  purchaseEvent('textbooks', 'A new reading list.', 'Required books cost $110. The library has limited copies you can share instead.', 11000, s => s.month >= 6 && age(s) < 22),
  { id: 'summer_internship', weight: 7, once: true, when: s => s.month >= 6 && age(s) < 22, build: () => ({ tag: 'OPPORTUNITY', title: 'A summer project needs help.', description: 'A short paid project offers $350 take-home, but uses the break you planned to spend with friends.', options: [option('work', 'Take the project', '+$350 one-time take-home', s => grant(s, 35000, 'summer project')), option('rest', 'Keep the break', 'Protect your free time')] }) },
  purchaseEvent('rideshare', 'You miss the last bus.', 'A ride home is $35. A friend can pick you up, but you will have to wait.', 3500, s => s.month >= 6),
  { id: 'store_card', weight: 3, once: true, when: s => s.month >= 6, build: () => ({ tag: 'CREDIT OFFER', title: '“Apply today and save!”', description: 'A store invites you to apply for credit. This prototype models the hard inquiry only; it does not open another account or award a discount.', options: [option('apply', 'Submit the application', 'Adds a hard inquiry; no extra credit in this sim', s => ({ state: { ...s, card: { ...s.card, inquiries: [...s.card.inquiries, s.month] } }, events: [{ type: 'inquiry' }] })), option('decline', 'Pass on the offer', 'Keep your current card')] }) },
  { id: 'graduation', weight: 20, once: true, when: s => age(s) >= 21, build: () => ({ tag: 'MILESTONE', title: 'Graduation. A first full-time offer.', description: 'An employer offers $2,800 monthly take-home. Living costs rise to $1,900 per month as you become independent.', options: [option('accept', 'Take the offer', '$2,800 income · $1,900 cash bills each month', s => ({ state: { ...s, income: { monthly: 280000 }, expenses: { monthly: 190000 }, flags: { ...s.flags, graduated: true, fullTimeJob: true } }, events: [{ type: 'career', what: 'You graduated and started your first full-time job.' }] })), option('search', 'Keep looking while working', 'Graduate; keep your current income and expenses', s => ({ state: { ...s, flags: { ...s.flags, graduated: true } }, events: [{ type: 'career', what: 'You graduated and kept your existing work while searching.' }] }))] }) },
  { ...purchaseEvent('apartment_deposit', 'A place of your own.', 'A new room requires an $800 deposit. It stays tied up for the lease; the game treats it as an expense and does not model its return.', 80000, s => age(s) >= 21 && s.flags.graduated, 9), build: s => ({ tag: 'HOUSING', title: 'A place of your own.', description: 'Move into a room with an $800 deposit, or stay where you are. The prototype treats the deposit as an expense, with no return modeled.', options: [cashOption(s, 80000, 'apartment deposit', 'Pay the deposit'), option('stay', 'Keep your current room', 'No moving expense')] }) },
  { id: 'rainy_day', weight: 4, once: true, when: s => s.month >= 6, build: s => ({ tag: 'SAVINGS', title: 'Build yourself a cushion.', description: 'Move $100 from checking into a separate emergency fund. You can move it back later from another opportunity.', options: [option('save', 'Set aside $100', 'Transfer checking → savings', x => ({ state: { ...x, cash: x.cash - 10000, savings: x.savings + 10000 }, events: [{ type: 'savings_transfer', amount: 10000 }] }), s.cash < 10000), option('wait', 'Keep it in checking', 'Preserve money for upcoming bills')] }) },
  { id: 'use_savings', weight: 5, once: true, when: s => s.savings > 0 && s.month >= 12, build: s => ({ tag: 'YOUR BUFFER', title: 'Put your cushion to work?', description: 'You can bring emergency savings back into checking for bills or debt payments, or leave it reserved.', options: [option('withdraw', 'Move savings to checking', `${dollars(s.savings)} available for your next payment`, x => ({ state: { ...x, cash: x.cash + x.savings, savings: 0 }, events: [{ type: 'savings_transfer', amount: -x.savings }] })), option('keep', 'Keep the reserve', 'No change to checking')] }) },
];
export const eligibleEvents = state => eventDeck.filter(event => event.when(state) && (!event.once || !state.seenEvents.includes(event.id)));
export function buildEvent(state, id) {
  const event = eventDeck.find(entry => entry.id === id);
  if (!event) return null;
  const built = event.build(state);
  return { eventId: id, kind: 'life', ...built, options: built.options.map(({ apply, ...display }) => display) };
}
export function applyEventChoice(state, id, index) {
  const event = eventDeck.find(entry => entry.id === id);
  const chosen = event?.build(state).options[index];
  if (!chosen || chosen.disabled) return { state, events: [] };
  const result = chosen.apply(state);
  return { state: { ...result.state, flags: { ...result.state.flags, ...(id === 'laptop' ? { laptopBought: true } : {}) }, seenEvents: [...new Set([...result.state.seenEvents, id])] }, events: [{ type: 'choice_made', eventId: id, label: chosen.label, choiceId: chosen.id }, ...result.events] };
}
