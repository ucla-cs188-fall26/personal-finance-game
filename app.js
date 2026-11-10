import { chapters, newRun, eventFor, decide, quizzes, money, LIMIT } from './engine.mjs';

const root = document.querySelector('#game');
const notes = document.querySelector('#notes');
const storageKey = 'money-run-playtest-v2';
const initial = () => ({ phase: 'intro', run: newRun(), before: [], after: [], confidence: {}, pending: false });
let state = initial();
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && ['intro', 'before', 'play', 'after', 'results'].includes(saved.phase)
    && Array.isArray(saved.run?.history) && Array.isArray(saved.before) && Array.isArray(saved.after)) state = saved;
} catch { /* Play still works without browser storage. */ }

const icon = (glyph, style = '') => `<span class="icon ${style}" aria-hidden="true">${glyph}</span>`;
const { length: total } = chapters;
const score = key => quizzes[key].filter((q, i) => state[key][i] === q[2]).length;
const title = text => `<h1 tabindex="-1">${text}</h1>`;
const stat = (label, value, style, glyph) => `<div class="stat">${icon(glyph, style)}<div><p>${label}</p><strong class="${style}">${value}</strong></div></div>`;
const nextButton = (label, action) => `<button type="button" class="primary" data-action="${action}">${label}<span aria-hidden="true">→</span></button>`;
const stepLabel = n => String(n).padStart(2, '0');

function sidebar() {
  const step = state.run.history.length;
  const active = step - Number(state.pending);
  return `<aside class="side">
    <div class="side-head"><span class="eyebrow">YOUR CHARACTER</span><span class="live"><i></i> ACTIVE</span></div>
    <div class="profile"><span class="avatar" aria-hidden="true">AM</span><div><strong>Alex Morgan</strong><p>Age 19 · College sophomore</p></div></div>
    <div class="wallet"><div class="side-head"><span class="eyebrow">WALLET</span><span class="wallet-note">SIMULATED USD</span></div>
      ${stat('Checking', money(state.run.cash), 'mint', '$')}
      ${stat('Card balance', money(state.run.balance), 'peach', '▤')}
      ${stat('Interest charged', money(state.run.interest), 'muted', '%')}
      <div class="usage"><span>Credit limit</span><span>${money(LIMIT)}</span></div>
      <progress aria-label="Credit used" max="${LIMIT}" value="${state.run.balance}"></progress>
    </div>
    <div class="timeline"><div class="side-head"><span class="eyebrow">YOUR TIMELINE</span><span class="wallet-note">${step} / ${total}</span></div>
      <ol>${chapters.map((label, i) => `<li class="${i < step ? 'done' : ''}" ${i === active && active < total ? 'aria-current="step"' : ''}><span class="number" aria-hidden="true">${i < step ? '✓' : stepLabel(i + 1)}</span>${label}</li>`).join('')}</ol>
    </div>
  </aside>`;
}

function intro() {
  return `<div class="hero">
    <div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="card-art"><span>STUDENT CREDIT</span><b>▰</b><span>•••• &nbsp; 2026</span></div><span class="spark">✦</span></div>
    <p class="eyebrow"><span class="chapter-chip">CHAPTER 01</span> <span class="hero-tag">THE CREDIT CARD ARC</span></p>
    ${title('Small choices.<br><em>Big balances.</em>')}
    <p class="lead">You’re a college sophomore with $720 in checking and your first credit card. When your laptop dies before midterms, how you pay is up to you.</p>
    ${nextButton('Start my run', 'start')}
    <div class="meta"><span>◷ &nbsp; ABOUT 5 MIN</span><span>◇ &nbsp; 7 LIFE EVENTS</span><span>NO REAL MONEY</span></div>
  </div>
  <div class="brief"><div>${icon('↗', 'mint')}<h2>Make the call</h2><p>Choose how to handle purchases, card bills, and a surprise expense.</p></div><div>${icon('≋', 'peach')}<h2>See what it costs</h2><p>Watch interest and cash change with each decision. Check what you learned at the end.</p></div></div>`;
}

function quiz(key) {
  const isBefore = key === 'before';
  return `<div class="panel">
    <p class="eyebrow"><span class="chapter-chip">${isBefore ? 'BEFORE YOU PLAY' : 'AFTER YOUR RUN'}</span></p>
    ${title(isBefore ? 'Quick knowledge check' : 'What stuck?')}
    <p class="lead">${isBefore ? 'Answer three questions so you can compare what you know now with what you know after the run.' : 'Try three new questions about the same ideas. Then compare your two scores.'}</p>
    <form id="quiz" data-quiz="${key}">
      ${quizzes[key].map(([prompt, answers], i) => `<fieldset><legend><span class="question-num">${stepLabel(i + 1)}.</span> ${prompt}</legend>${answers.map((answer, j) => `<label class="answer"><input type="radio" name="q${i}" value="${j}" required> ${answer}</label>`).join('')}</fieldset>`).join('')}
      <fieldset><legend><label for="confidence">How confident are you that you could manage your own credit card bill?</label></legend>
        <select id="confidence" name="confidence" required><option value="">Choose 1–10</option>${Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1}${i === 0 ? ' — Not confident' : i === 9 ? ' — Very confident' : ''}</option>`).join('')}</select>
      </fieldset>
      <button class="primary" type="submit">${isBefore ? 'Enter the simulation' : 'See my results'}<span aria-hidden="true">→</span></button>
    </form>
  </div>`;
}

function play() {
  const step = state.run.history.length;
  if (state.pending) {
    const { label, story, delta } = state.run.history.at(-1);
    const changes = Object.entries(delta).filter(([, value]) => value)
      .map(([key, value]) => `<span class="change">${{cash:'Checking', balance:'Card balance', interest:'Interest', aid:'Family help'}[key]} <strong>${value > 0 ? '+' : '−'}${money(Math.abs(value))}</strong></span>`).join('');
    return `<div class="panel decision"><p class="eyebrow"><span class="chapter-chip">EVENT ${stepLabel(step)} / ${stepLabel(total)}</span> &nbsp; OUTCOME</p>
      ${title(label)}<p class="lead">${story}</p>
      <div class="changes">${changes || '<span class="change">No change to your wallet</span>'}</div>
      ${nextButton(step === total ? 'Take the final check' : 'Continue to next event', 'continue')}</div>`;
  }
  const event = eventFor(state.run);
  return `<div class="panel decision">
    <p class="eyebrow"><span class="chapter-chip">EVENT ${stepLabel(step + 1)} / ${stepLabel(total)}</span> &nbsp; ${event.tag}</p>
    ${title(event.title)}<p class="lead">${event.description}</p>
    <div class="choices">${event.options.map((option, i) => `<button class="choice" type="button" data-choice="${i}" ${option.disabled ? 'disabled' : ''}><span class="choice-number">${stepLabel(i + 1)}</span><span><strong>${option.label}</strong><small>${option.detail}${option.disabled ? ' · Unavailable' : ''}</small></span><span class="choice-arrow" aria-hidden="true">→</span></button>`).join('')}</div>
  </div>`;
}

function results() {
  const { cash, balance, interest, aid, history } = state.run;
  const gain = score('after') - score('before');
  return `<div class="panel">
    <p class="eyebrow"><span class="chapter-chip">CHAPTER COMPLETE</span></p>
    ${title(balance ? 'The semester ends.' : 'You cleared your card.')}
    <p class="lead">You finished with ${money(cash)} in checking and ${money(balance)} left on your card. This run cost ${money(interest)} in interest${aid ? ` and you received ${money(aid)} in family help` : ''}.</p>
    <div class="scores"><div><span>BEFORE</span><strong>${score('before')} / 3</strong></div><div><span>AFTER</span><strong>${score('after')} / 3</strong></div><div><span>CHANGE</span><strong class="mint">${gain > 0 ? '+' : ''}${gain}</strong></div></div>
    <p class="confidence">Confidence: <strong>${state.confidence.before}/10</strong> before → <strong>${state.confidence.after}/10</strong> after.</p>
    <details><summary>Review the final knowledge check</summary><ol class="review">${quizzes.after.map(([prompt, answers, correct], i) => `<li><strong>${prompt}</strong><p>Your answer: ${answers[state.after[i]]}</p><p>Correct answer: ${answers[correct]}</p></li>`).join('')}</ol></details>
    <details><summary>Review your decisions</summary><ol class="review">${history.map(item => `<li><strong>${item.label}</strong><p>${item.story}</p></li>`).join('')}</ol></details>
    ${nextButton('Play another run', 'restart')}
  </div>`;
}

function render(focus = false) {
  const content = { intro, before: () => quiz('before'), play, after: () => quiz('after'), results };
  const { cash, balance, interest } = state.run;
  const wallet = state.phase === 'play' ? `<div class="mobile-wallet" aria-label="Wallet">
    <span>Checking <strong class="mint">${money(cash)}</strong></span>
    <span>Card <strong class="peach">${money(balance)}</strong></span>
    <span>Interest <strong>${money(interest)}</strong></span>
  </div>` : '';
  root.innerHTML = `<section class="stage" aria-label="Simulation">${wallet}${content[state.phase]()}</section>${sidebar()}`;
  if (focus) {
    root.querySelector('h1').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Storage is optional. */ }
  render(true);
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.action === 'notes') return notes.showModal();
  if (button.dataset.choice !== undefined && state.phase === 'play' && !state.pending) {
    const next = decide(state.run, Number(button.dataset.choice));
    if (next !== state.run) {
      state.run = next;
      state.pending = true;
      save();
    }
  } else if (button.dataset.action === 'start' && state.phase === 'intro') {
    state.phase = 'before';
    save();
  } else if (button.dataset.action === 'continue' && state.pending) {
    state.pending = false;
    if (state.run.history.length === total) state.phase = 'after';
    save();
  } else if (button.dataset.action === 'restart' && state.phase === 'results') {
    state = initial();
    save();
  }
});

root.addEventListener('submit', event => {
  event.preventDefault();
  const key = event.target.dataset.quiz;
  if (key !== state.phase || !quizzes[key]) return;
  const form = new FormData(event.target);
  state[key] = quizzes[key].map((_, i) => Number(form.get(`q${i}`)));
  state.confidence[key] = Number(form.get('confidence'));
  state.phase = key === 'before' ? 'play' : 'results';
  save();
});

render();
