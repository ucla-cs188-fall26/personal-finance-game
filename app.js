import { newGame, ageOf, dateOf, utilization, totalDebt, netWorth, money } from './engine/state.mjs';
import { advanceMonth, advanceYear, resolveChoice } from './engine/tick.mjs';
import { creditFactors, band } from './engine/credit.mjs';
import { quizzes } from './engine/legacy.mjs';
import { lessonFor } from './learning.mjs';
const root = document.querySelector('#game');
const popup = document.querySelector('#choice');
const notes = document.querySelector('#notes');
const key = 'money-run-v3';
const fresh = () => ({ game: newGame(), screen: 'intro', playtest: false, before: [], after: [], confidence: {}, receipt: null });
let session = fresh();
let notice = '';
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved?.game?.card && Array.isArray(saved.game.log) && Number.isInteger(saved.game.month) && ['intro','life','stats','before','after','ending'].includes(saved.screen)) session = saved;
} catch { notice = 'Your saved run could not be loaded. A new life is ready.'; }
let collection = [];
try { const stored = JSON.parse(localStorage.getItem('money-run-v3-badges')); if (Array.isArray(stored)) collection = stored.filter(x => typeof x === 'string'); } catch {}
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn = (label, action, cls = 'primary') => `<button type="button" class="${cls}" data-action="${action}">${label}</button>`;
const heading = text => `<h1 tabindex="-1">${text}</h1>`;
const percent = n => `${Math.round(n * 100)}%`;
const date = month => { const d = dateOf({ ...session.game, month }); return new Date(d.year,d.monthIndex).toLocaleDateString('en-US',{month:'long',year:'numeric'}); };
const scoreText = s => s === null ? 'No score yet' : s;
const scoreQuiz = phase => quizzes[phase].filter((q,i) => session[phase][i] === q[2]).length;
function badges() {
 const s = session.game;
 return [
 ['first','🌱','First steps',s.log.some(e => e.type === 'choice_made')],
 ['clean','💎','Clean slate',s.log.some(e => e.type === 'payment' && e.kind === 'full' && e.amount > 0)],
 ['score','📈','First score',s.credit.score !== null],
 ['streak','🔥','Six on time',s.card.onTimeStreak >= 6 || s.flags.sixOnTime],
 ['graduate','🎓','Life lived',s.phase === 'ended'],
 ];
}
function persist() {
 for (const [id,,,earned] of badges()) if (earned && !collection.includes(id)) collection.push(id);
 try { localStorage.setItem(key,JSON.stringify(session)); localStorage.setItem('money-run-v3-badges',JSON.stringify(collection)); } catch { notice = 'Browser storage is unavailable. This run will last until the page closes.'; }
}
function topbar() {
 const s = session.game;
 const diff = session.scoreDelta || 0;
 return `<div class="topbar"><div class="character"><div class="avatar">🧑‍🎓</div><div><strong>Alex Morgan <span>Age ${ageOf(s)}</span></strong><small>${date(s.month)}</small></div></div><div class="top-money"><span>CHECKING<strong>${money(s.cash)}</strong></span><span>CARD DEBT<strong class="peach">${money(s.card.balance)}</strong></span><span>SIMULATED SCORE<strong>${scoreText(s.credit.score)} ${diff ? `<small class="${diff < 0 ? 'peach' : 'mint'}">${diff > 0 ? '▲' : '▼'}${Math.abs(diff)}</small>` : ''}</strong></span></div>${btn(session.screen === 'stats' ? '← Life' : '◴ Stats',session.screen === 'stats' ? 'life' : 'stats','secondary')}</div>`;
}
function intro() {
 return `<section class="hero"><p class="eyebrow">A FINANCIAL LIFE SIMULATOR</p><div class="hero-emoji" aria-hidden="true">🧑‍🎓</div>${heading('Your life.<br><em>Your next move.</em>')}<p class="lead">A new credit card. A broken laptop. A whole life ahead.<br>Start at 19. Make the calls. Find out where your money takes you.</p><div class="start-info"><span><b>$720</b> in checking</span><span><b>6 years</b> to explore</span><span><b>One life</b> at a time</span></div>${btn('▶ Start my life','start')}<button class="text-button" data-action="playtest">Research playtest · include before & after checks</button><p class="fine">One month per move for your first year. Then age up a year at a time.<br>Fictional money and an educational credit score. No real-world stakes.</p></section><div class="intro-cards"><article><span>💳</span><h2>Live with your choices</h2><p>Pay in full, carry a balance, or miss a payment. Watch the consequences unfold.</p></article><article><span>🧠</span><h2>Get wiser as you go</h2><p>Unlock practical money lessons in the moments they matter.</p></article><article><span>↻</span><h2>Try another life</h2><p>Different choices. Different events. New milestones to discover.</p></article></div>`;
}
function feed() {
 const s = session.game;
 let lastAge = null;
 const entries = s.log.map(entry => {
  const age = s.startAge + Math.floor((entry.month || 0)/12);
  const group = age !== lastAge ? `<h2 class="age-label">AGE ${age}<span>${date(entry.month || 0)}</span></h2>` : '';
  lastAge = age;
  return `${group}<article class="feed-entry ${entry.tone === 'bad' ? 'bad' : entry.tone === 'good' ? 'good' : ''}"><span class="entry-icon" aria-hidden="true">${esc(entry.icon || '•')}</span><div><p>${esc(entry.text)}</p></div></article>`;
 }).join('');
 return `<div class="life-grid"><section class="life-panel"><div class="section-head"><div><p class="eyebrow">YOUR STORY</p>${heading('Life happens.')}</div><span class="mode-tag">${s.phase === 'monthly' ? 'MONTH BY MONTH' : s.phase === 'ended' ? 'CHAPTER COMPLETE' : 'YEAR BY YEAR'}</span></div><div class="feed" id="life-feed" tabindex="0" aria-label="Life journal">${entries || '<div class="first-entry"><span>🌱</span><h2>A fresh start.</h2><p>You’re 19, starting sophomore year with $720 and a new credit card. Your first month is waiting.</p></div>'}</div><div class="advance-bar">${s.pending ? '<p>Make your choice to keep your story moving.</p>' : s.phase === 'ended' ? btn('See how this life turned out →','ending') : btn(s.phase === 'monthly' ? '＋ Next month' : '＋ Age up','advance')}<small>${s.phase === 'monthly' ? `${s.month} / 12 months · learning the ropes` : 'Monthly bills and payments continue between life events.'}</small></div></section><aside><section class="side-card"><p class="eyebrow">THE BIG PICTURE</p><div class="networth"><small>Net worth</small><strong>${money(netWorth(s))}</strong></div><div class="metric"><span>Credit used</span><b>${percent(utilization(s))}</b></div><progress max="100" value="${Math.min(100,utilization(s)*100)}" aria-label="Credit utilization"></progress><div class="metric"><span>Interest charged</span><b>${money(s.card.interestPaid)}</b></div><div class="metric"><span>On-time streak</span><b>${s.card.onTimeStreak} months</b></div><p class="fine">${s.phase === 'monthly' ? 'Choose a payment each month. At age 20, set your standing plan in Stats.' : `Standing plan: ${esc(s.paymentPolicy)}. Change it in Stats before aging up.`}</p></section><section class="side-card"><p class="eyebrow">YOUR MILESTONES</p>${badges().map(([id,icon,name,earned]) => `<div class="badge ${earned || collection.includes(id) ? 'earned' : ''}"><span>${icon}</span><div><strong>${name}</strong><small>${earned ? 'Earned this life' : collection.includes(id) ? 'In your collection' : 'Still to discover'}</small></div></div>`).join('')}</section></aside></div>`;
}
function stats() {
 const s = session.game;
 const factors = creditFactors(s);
 const factorsNames = {payment:'Payment history · 35%',amounts:'Amounts owed · 30%',age:'Account age · 15%',newCredit:'New credit · 10%',mix:'Credit mix · 10%'};
 const hist = s.credit.history.filter(h => Number.isFinite(h.score));
 const points = hist.map((h,i) => `${hist.length === 1 ? 0 : i/(hist.length-1)*500},${110-(h.score-300)/550*100}`).join(' ');
 const metric = (name,value) => `<div class="stat-tile"><span>${name}</span><strong>${value}</strong></div>`;
 return `<section class="stats-page"><p class="eyebrow">YOUR FINANCIAL SNAPSHOT</p>${heading('Know your numbers.')}<div class="stats-grid"><section class="panel"><h2>Money</h2><div class="tiles">${metric('Checking',money(s.cash))}${metric('Savings',money(s.savings))}${metric('Total debt',money(totalDebt(s)))}${metric('Net worth',money(netWorth(s)))}${metric('Monthly take-home',money(s.income.monthly))}${metric('Monthly cash bills',money(s.expenses.monthly))}${metric('Monthly card spending',money(s.spending.monthly))}</div><h2>Your payment plan</h2><p class="fine">${s.phase === 'monthly' ? 'Available at age 20. For now, decide each month.' : 'Applied every month during an age-up. If cash runs short, the game pays only what is available.'}</p><label for="policy">Standing payment</label><select id="policy" ${s.phase !== 'yearly' ? 'disabled' : ''}>${[['full','Pay in full'],['minimum','Pay the minimum'],['fixed','Pay a fixed amount'],['none','Pay nothing']].map(([id,label]) => `<option value="${id}" ${s.paymentPolicy === id ? 'selected' : ''}>${label}</option>`).join('')}</select><label for="fixed-payment">Fixed payment ($)</label><input id="fixed-payment" type="number" min="0" max="1000000" step="0.01" value="${s.fixedPayment/100}" ${s.phase !== 'yearly' || s.paymentPolicy !== 'fixed' ? 'disabled' : ''}><p class="fine" id="plan-feedback" role="status"></p><h2>Life</h2><p>Alex Morgan · Age ${ageOf(s)} · ${s.flags.graduated ? 'Graduate' : ageOf(s) >= 21 ? 'College senior' : 'College student'}</p></section><section class="panel"><div class="credit-title"><div><p class="eyebrow">SIMULATED CREDIT</p><strong>${scoreText(s.credit.score)}</strong><p>${s.credit.score === null ? 'Your first score needs six cycles of history.' : band(s.credit.score)}</p></div><span>◴</span></div><svg class="sparkline" viewBox="0 0 500 120" role="img" aria-label="Simulated credit score history"><path d="M0 110H500" stroke="#394b50"/><polyline points="${points}" fill="none" stroke="#a5f3cb" stroke-width="3"/></svg>${Object.entries(factorsNames).map(([id,label]) => `<div class="factor"><div><span>${label}</span><b>${percent(factors[id] || 0)}</b></div><progress value="${factors[id] || 0}" max="1" aria-label="${label}"></progress></div>`).join('')}<p class="fine">Factor strength in our teaching model, not a real credit bureau score. Paying the minimum on time is not itself a late payment; a high balance can lower the amounts-owed factor.</p><div class="tiles">${metric('Current APR',`${((s.card.penaltyActive ? s.card.penaltyApr : s.card.apr)*100).toFixed(2)}%${s.card.penaltyActive ? ' · PENALTY' : ''}`)}${metric('Card limit',money(s.card.limit))}${metric('Minimum due',money(s.card.minimumDue))}${metric('Interest charged',money(s.card.interestPaid))}${metric('Fees charged',money(s.card.feesPaid))}${metric('On-time streak',`${s.card.onTimeStreak} months`)}</div><details><summary>Late marks (${s.card.lateMarks.length})</summary>${s.card.lateMarks.map(m => `<p>${date(m.month)} · ${m.days} days late</p>`).join('') || '<p>No late marks. Keep it going.</p>'}</details></section></div></section>`;
}
function ending() {
 const s = session.game;
 const choices = s.log.filter(e => e.type === 'choice_made');
 const costly = s.log.find(e => ['penalty_apr_on','late_fee','grace_lost'].includes(e.type));
 const good = s.log.find(e => e.type === 'payment' && e.kind === 'full' && e.amount > 0);
 return `<section class="panel ending"><div class="ending-icon">🎓</div><p class="eyebrow">AGE ${ageOf(s)} · ONE LIFE, MANY CHOICES</p>${heading(s.card.balance === 0 ? 'A fresh chapter. A clean slate.' : 'Your story is still yours.')}<p class="lead">From your first card to age ${ageOf(s)}, every choice left a mark. Here’s where this life landed.</p><div class="tiles"><div class="stat-tile"><span>Net worth</span><strong>${money(netWorth(s))}</strong></div><div class="stat-tile"><span>Simulated score</span><strong>${scoreText(s.credit.score)}</strong><small>${s.credit.score === null ? '' : band(s.credit.score)}</small></div><div class="stat-tile"><span>Interest charged</span><strong>${money(s.card.interestPaid)}</strong></div><div class="stat-tile"><span>Fees charged</span><strong>${money(s.card.feesPaid)}</strong></div></div><div class="reflection"><h2>A habit that helped</h2><p>${good ? 'You paid a statement in full. That reduced the balance you carried into the next month.' : 'You reached the end and saw the consequences. Try an on-time payment plan in your next life.'}</p><h2>A costly turning point</h2><p>${costly ? esc(costly.text) : 'You avoided the main credit traps in this run. See what happens if your next life takes a different path.'}</p></div><div class="challenge"><strong>↻ Your next-life challenge</strong><p>${s.card.feesPaid ? 'Can you reach 25 without a late fee?' : s.card.interestPaid ? 'Try paying in full and keeping the grace period for an entire life.' : 'Keep your credit habits and try different life choices. Where will you end up?'}</p></div>${session.playtest ? session.after.length ? `<p>Knowledge check: ${scoreQuiz('before')}/3 before → ${scoreQuiz('after')}/3 after. Confidence: ${session.confidence.before}/10 → ${session.confidence.after}/10.</p><details><summary>Review answers</summary>${quizzes.after.map(([q,a,c],i) => `<p><strong>${esc(q)}</strong><br>Your answer: ${esc(a[session.after[i]])}<br>Correct: ${esc(a[c])}</p>`).join('')}</details>` : btn('Complete the playtest check','after','secondary') : ''}<details><summary>Your money skills notebook</summary>${[...new Set(choices.map(e => e.eventId).filter(Boolean))].map(id => {const l=lessonFor(id);return `<h3>${l.skill}</h3><p>${l.action}</p><a href="${l.source[1]}" target="_blank" rel="noopener noreferrer">${l.source[0]} ↗</a>`;}).join('')}</details>${btn('↻ Start another life','restart')}${btn('Look back at my life','life','secondary')}</section>`;
}
function quiz(phase) {
 return `<section class="panel quiz"><p class="eyebrow">RESEARCH PLAYTEST · ${phase.toUpperCase()}</p>${heading(phase === 'before' ? 'What do you know today?' : 'What stuck with you?')}<p class="lead">Three questions and a confidence check. Your answers stay in this browser.</p><form id="quiz" data-phase="${phase}">${quizzes[phase].map(([q,a],i) => `<fieldset><legend>${i+1}. ${esc(q)}</legend>${a.map((answer,j) => `<label class="answer"><input type="radio" required name="q${i}" value="${j}">${esc(answer)}</label>`).join('')}</fieldset>`).join('')}<label for="confidence">How confident are you managing a credit card bill?</label><select name="confidence" id="confidence" required><option value="">Choose 1–10</option>${Array.from({length:10},(_,i) => `<option value="${i+1}">${i+1}${i===0?' · Not confident':i===9?' · Very confident':''}</option>`).join('')}</select><button class="primary" type="submit">${phase === 'before' ? 'Start my life →' : 'See my results →'}</button></form></section>`;
}
function popupContent() {
 if (session.receipt) {
  const r = session.receipt;
  const l = lessonFor(r.lessonId,{ kind:r.kind });
  const answer = r.answer;
  return `<p class="eyebrow">CHOICE MADE · KEEP LEARNING</p><h2 id="choice-title">${esc(r.label)}</h2><p>${esc(r.outcome)}</p><section class="lesson"><p class="eyebrow">💡 ${l.skill}</p><h3>${l.title}</h3><p>${l.why}</p><details><summary>Try this in real life</summary><p>${l.action}</p></details>${l.fact ? `<p class="fact">${l.fact}</p>` : ''}<a href="${l.source[1]}" target="_blank" rel="noopener noreferrer">${l.source[0]} ↗</a><details ${answer !== undefined ? 'open' : ''}><summary>⚡ Optional quick challenge</summary><p>${l.question}</p><div class="practice-options">${l.answers.map((a,i) => `<button data-practice="${i}" ${answer!==undefined?'disabled':''}>${a}</button>`).join('')}</div>${answer!==undefined?`<p role="status"><strong>${answer === l.correct ? 'You got it.' : 'Here’s the idea.'}</strong> ${l.explanation}</p>`:''}</details></section>${btn('Continue my life →','continue')}`;
 }
 const p = session.game.pending;
 if (!p) return '';
 return `<p class="eyebrow">${p.kind === 'payment' ? '💳 YOUR CARD STATEMENT' : '✨ A MOMENT IN YOUR LIFE'}</p><h2 id="choice-title">${esc(p.title)}</h2><p>${esc(p.description)}</p>${p.kind === 'payment' ? `<div class="payment-facts"><span>Checking <b>${money(session.game.cash)}</b></span><span>Balance <b>${money(session.game.card.balance)}</b></span><span>Minimum <b>${money(session.game.card.minimumDue)}</b></span></div><label for="custom">Custom payment ($)</label><input id="custom" type="number" min="0" max="${Math.min(session.game.cash,session.game.card.balance)/100}" step="0.01" value="${Math.min(session.game.cash,Math.ceil(session.game.card.balance/2))/100}"><p id="custom-error" role="alert"></p>` : ''}<div class="choices">${p.options.map((o,i) => `<button class="choice" data-choice="${i}" ${o.disabled ? 'disabled' : ''}><span class="choice-num">${String(i+1).padStart(2,'0')}</span><span><strong>${esc(o.label)}</strong><small>${esc(o.detail)}${o.disabled ? ' · Unavailable with your current balance' : ''}</small></span><span>→</span></button>`).join('')}</div>`;
}
function render(focus=false) {
 const active = !['intro','before'].includes(session.screen);
 root.innerHTML = `${notice ? `<p role="status" class="notice">${esc(notice)}</p>` : ''}${active?topbar():''}${session.screen==='intro'?intro():session.screen==='life'?feed():session.screen==='stats'?stats():session.screen==='ending'?ending():quiz(session.screen)}`;
 const content = session.screen==='life' ? popupContent() : '';
 if (content) { popup.innerHTML=content; if (!popup.open) popup.showModal(); }
 else if (popup.open) popup.close();
 if (focus && !popup.open) root.querySelector('h1')?.focus({preventScroll:true});
 const f=document.querySelector('#life-feed'); if(f) f.scrollTop=f.scrollHeight;
}
function apply(result) {
 const before = session.game.credit.score;
 session.game=result.state;
 session.scoreDelta=before===null || result.state.credit.score===null ? 0 : result.state.credit.score-before;
 if (session.game.card.onTimeStreak >= 6) session.game.flags.sixOnTime=true;
 persist(); render();
}
popup.addEventListener('cancel', e => e.preventDefault());
document.addEventListener('click', e => {
 const b=e.target.closest('button'); if(!b)return;
 const action=b.dataset.action;
 if(action==='notes')return notes.showModal();
 if(action==='close-notes')return notes.close();
 if(action==='restart'){session=fresh();persist();render(true);return;}
 if(action==='start'||action==='playtest'){session.playtest=action==='playtest';session.screen=action==='playtest'?'before':'life';persist();render(true);return;}
 if(['stats','life','ending','after'].includes(action)){session.screen=action;persist();render(true);return;}
 if(action==='advance'&&!session.game.pending){apply(session.game.phase==='yearly'?advanceYear(session.game):advanceMonth(session.game));return;}
 if(action==='continue'){session.receipt=null;persist();render();return;}
 if(b.dataset.practice!==undefined&&session.receipt){session.receipt.answer=Number(b.dataset.practice);persist();render();return;}
 if(b.dataset.choice!==undefined&&session.game.pending){
  const index=Number(b.dataset.choice), pending=session.game.pending, option=pending.options[index];
  let custom;
  if(option.id==='custom'||option.id==='fixed'){
   const input=document.querySelector('#custom');
   if(!input?.checkValidity()){input?.reportValidity();return;}
   custom=Math.round(Number(input.value)*100);
  }
  const result=resolveChoice(session.game,index,custom);
  if(result.state===session.game)return;
  const consequences=result.events.filter(ev=>['penalty_apr_on','late_mark','late_fee','grace_lost','score_first','grace_restored'].includes(ev.type));
  session.receipt={label:option.label,kind:pending.kind,lessonId:consequences[0]?.type||pending.eventId,outcome:result.state.log.slice(session.game.log.length).filter(e => !['payday','bills','statement','choice_made'].includes(e.type)).slice(0,4).map(e => e.text).join(' ') || 'Your choice keeps your current finances unchanged.'};
  apply(result);
 }
});
root.addEventListener('change', e=>{
 if(e.target.id==='policy'&&session.game.phase==='yearly'){session.game.paymentPolicy=e.target.value;persist();render();}
 if(e.target.id==='fixed-payment'&&session.game.phase==='yearly'&&e.target.checkValidity()){session.game.fixedPayment=Math.round(Number(e.target.value)*100);persist();document.querySelector('#plan-feedback').textContent='Payment plan saved.';}
});
root.addEventListener('submit', e=>{
 if(e.target.id!=='quiz')return;
 e.preventDefault();const phase=e.target.dataset.phase;const data=new FormData(e.target);
 session[phase]=quizzes[phase].map((_,i)=>Number(data.get(`q${i}`)));session.confidence[phase]=Number(data.get('confidence'));
 session.screen=phase==='before'?'life':'ending';persist();render(true);
});
render();
