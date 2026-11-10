# Money Run

Money Run is a BitLife-inspired personal finance simulation for UCLA CS 188. It gives young adults nearing financial independence a place to make their first money decisions without risking real cash.

## Run it

From the project directory, start a local server:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000. No dependencies, account, or API key are needed. The current run is saved in that browser. To run the simulation checks, use `node --test` (Node 18 or later).

## Prototype scope

The first chapter follows a college sophomore who needs a laptop before midterms. Over seven events, players choose how to pay, respond to a repair and a job opportunity, and decide whether to accept help from family. The wallet shows checking, card balance, and cumulative interest after every choice.

The fictional card uses a $1,000 limit, a 24% APR, and a $35 minimum capped at the statement balance. The model adds 2% of the unpaid balance each statement cycle and rounds to cents. It leaves out daily balance calculations, trailing interest, fees, and credit scores. See the in-game notes for CFPB references. Taxes and retirement are possible future chapters.

## Playtest guide

Recruit young adults ages 18–25, especially students and people in their first jobs. Ask each participant to complete the opening check, play one run without coaching, and complete the final check. Record the two quiz scores and confidence ratings with the participant’s permission; the prototype does not send results anywhere. Ask what they expected after paying less than the full balance, what surprised them, and whether the choices felt plausible. Compare what they explain in their own words with the quiz results.

The two quizzes use different examples covering the same three ideas. Score changes are useful for finding confusing material in this prototype; a comparison group and a later follow-up would help test whether the game improves learning and retention.
