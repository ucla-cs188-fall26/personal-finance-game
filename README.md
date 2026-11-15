# Money Run

Money Run is a BitLife-inspired personal finance simulation for UCLA CS 188. It gives young adults nearing financial independence a place to make their first money decisions without risking real cash.

## Run it

You need Git, Python 3, and a web browser. Node 18 or later is only needed to run the tests.

Download the project and switch to the prototype branch (skip the last line if the prototype is already on `main`):

```sh
git clone https://github.com/ucla-cs188-fall26/personal-finance-game.git
cd personal-finance-game
git checkout shreyas-branch
```

From the project directory, start a local server:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

On Windows, use `python` instead of `python3` if `python3` is not found.

Open http://localhost:8000. No dependencies, account, or API key are needed. The current run is saved in that browser. To run the simulation checks, use `node --test` (Node 18 or later).

To stop the server, press Ctrl+C in the terminal.

## Play the core scenario

1. On the opening screen, click **▶ Play my life**.
2. Choose how to pay for the laptop. The wallet on the right shows your checking, card balance, and interest.
3. Read the outcome and the money skill card, then click **＋ Move life forward**.
4. Repeat for all seven events: three card statements, a bike repair, a campus job, and a call from Dad.
5. After the seventh event, click **🎓 Finish the semester**, answer the three-question check, and click **See my results**.
6. The results screen shows your final cash, card balance, total interest paid, milestones, and the money skills notebook. Click **Start a new life** to play again, or **↻ Start over** at the top at any time.

## Prototype scope

The first chapter follows a college sophomore who needs a laptop before midterms. Over seven events, players choose how to pay, respond to a repair and a job opportunity, and decide whether to accept help from family. The wallet shows checking, card balance, and cumulative interest after every choice.

The fictional card uses a $1,000 limit, a 24% APR, and a $35 minimum capped at the statement balance. The model adds 2% of the unpaid balance each statement cycle and rounds to cents. It leaves out daily balance calculations, trailing interest, fees, and credit scores. See the in-game notes for CFPB references. Taxes and retirement are possible future chapters.

## Playtest guide

Recruit young adults ages 18–25, especially students and people in their first jobs. Choose Playtest mode on the opening screen, then ask each participant to complete the opening check, play one run without coaching, and complete the final check. Record the two quiz scores and confidence ratings with the participant’s permission; the prototype does not send results anywhere. Ask what they expected after paying less than the full balance, what surprised them, and whether the choices felt plausible. Compare what they explain in their own words with the quiz results.

The two quizzes use different examples covering the same three ideas. Score changes are useful for finding confusing material in this prototype; a comparison group and a later follow-up would help test whether the game improves learning and retention.

## Game progression

Standard play starts with the first life decision. Playtest mode keeps the baseline quiz. Each decision grants 50 experience points for participation, regardless of financial outcome. Milestones reward the first decision, a full statement payment, completing the semester, and finishing debt-free with a $300 cash buffer. The milestone collection and completed-run count persist in the browser across replays. A dated life feed records choices, and the ending suggests a challenge based on the finished run.

## Learning during play

Each decision outcome includes a contextual explanation, a practical money habit, and a linked CFPB or Federal Reserve fact. Optional short challenges give immediate explanatory feedback without blocking the next event or penalizing mistakes. Statement challenges progress from calculating interest to comparing payments to applying grace-period rules. The ending includes a money skills notebook. Statistics identify the survey year and population; game calculations are distinguished from real card terms. Learning effectiveness still needs user testing with the before/after checks and later recall.
