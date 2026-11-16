# Money Run

A BitLife-inspired personal finance game for UCLA CS 188. Play from age 19 to 25: move one month at a time for your first year with a credit card, then one year at a time. Paychecks, bills, interest, choices and credit history carry forward.

## Run locally

You need Git, Python 3 and a browser. Node 18+ runs the tests; no packages or build step are required.

```sh
git clone --branch shreyas-branch https://github.com/ucla-cs188-fall26/personal-finance-game.git
cd personal-finance-game
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000. Stop the server with Ctrl+C. On Windows, explicitly set the JavaScript MIME type for `.mjs`:

```sh
python -c "import http.server as s; s.SimpleHTTPRequestHandler.extensions_map['.mjs']='text/javascript'; s.test(s.SimpleHTTPRequestHandler, port=8000, bind='127.0.0.1')"
```

Run tests with `node --test`. Changes in this checkout must be committed and pushed before a fresh clone receives them.

## Playing

Start a normal life for uninterrupted play, or choose Playtest mode for a baseline and ending quiz. Advance months, resolve life events and choose how to pay each statement. At age 20, choose a standing payment plan in Stats; each Age up processes twelve monthly cycles, pausing for up to two life events. Stats explains the simulated credit factors, spending, debt, and payment history. The run ends at age 25. Start over resets the current life.

The game uses a new browser save key, `money-run-v3`; old semester saves are not loaded. Saves stay on the device. Random events are seeded so identical initial state and choices reproduce the same run.

## Simulation assumptions

All money uses integer cents. Starting checking is $720, monthly take-home income $900, cash bills $750, and regular card spending $80. Story choices can change income and costs. Purchase attempts above the $1,000 card limit are declined; interest and fees can increase debt beyond the limit.

The fictional card uses 24% APR, rising to 29.99% after two consecutive missed monthly minimums. The minimum is capped at the balance and otherwise the greater of $25 or 1% of principal plus current interest and applicable fees. The first late fee is $30; another within six cycles is $41. These are fixed game contract terms, not a statement of current legal fee limits or a universal issuer policy.

For clarity, one step models a complete billing cycle and payment deadline. A cycle with a grace period adds no interest; carrying a balance removes grace for the next cycle. Without grace, interest is the balance times APR divided by twelve, rounded to cents. Full payment restores grace for the next cycle. Six on-time payments remove the penalty rate. Real cards may use daily balances, trailing interest, different grace restoration rules and notices. This game omits collections, charge-off, bankruptcy and detailed taxes.

The counters named `interestPaid` and `feesPaid` in state track **charges**, not cash actually repaid. UI totals label them accordingly.

## Credit scores are illustrative

The score is a transparent educational approximation, not FICO's proprietary formula or a prediction of a player's real score. It uses five factors with illustrative weights: payment 35%, amounts owed 30%, history length 15%, new credit 10%, mix 10%. The score first appears after six completed statements. Simulated late marks occur at 30/60/90 days; their model penalties fade over 84 months. Score recovery is gradual. Utilization is measured at statement close, so paying in full does not erase the reported statement usage.

Paying the minimum **on time is not a missed payment**. Its risks are continued interest and a potentially high balance. The plan's illustrative target scores and payoff duration are not hard-coded: results follow the formula and choices.

Reference reading: [myFICO score factors](https://www.myfico.com/credit-education/whats-in-your-credit-score), [myFICO starting credit history](https://www.myfico.com/credit-education/faq/improving-a-score/building-credit-history), [CFPB grace periods](https://www.consumerfinance.gov/ask-cfpb/what-is-a-grace-period-for-a-credit-card-en-47/), [CFPB interest calculations](https://www.consumerfinance.gov/ask-cfpb/how-does-my-credit-card-company-calculate-the-amount-of-interest-i-owe-en-51/).

## Architecture and testing

`engine/state.mjs` owns the shared state and calendar. Card and credit modules return immutable `{ state, events }` results. The tick module controls pauses and monthly/yearly progression; the event deck uses IDs, and pending choices are serializable. Narration converts typed events to the life feed. `engine/legacy.mjs` preserves the original semester prototype for reference.

## Playtest guide

Recruit 3–5 people aged 18–25. Ask each to play without coaching in Playtest mode, recording their baseline and final answers with permission. Ask them to explain the difference between paying the minimum, paying in full and missing a payment; why a score changed; and what habit they would use in real life. Repeat a transfer question later to check retention. Compare full-payment, minimum-payment and missed-payment runs. Log confusing wording and unexpected outcomes.

The software checks cannot establish that real players learn. Participant recruitment, teammate review and actual playtests remain team activities.

### Calibration and verification

A controlled 12-cycle test with a $600 initial laptop and $80 recurring monthly charges (without later story events) leaves full-payment debt at $0 with $0 interest and score 746. Minimum payments leave $949.94 debt (95% utilization), $202.47 interest and score 614. Skipping leaves $1,645.59 debt, $481 fees and score 422. Story income and purchases change actual playthrough results. Ongoing severe delinquency refreshes its current 90-day mark instead of incorrectly recovering as the original mark ages.

Browser verification covered a complete standard run to age 25, the ending, Stats, reload, restart, and resuming a pending choice after reload. No browser console errors were observed. This was an interactive browser smoke check; a separate installed headless-browser test runner was not added.
