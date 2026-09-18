/* ---------- ARCADE: QUIZ RUSH ----------
   Schnelle Multiple-Choice-Runden gegen die Uhr. 3 Leben, steigendes Tempo. */
const QUIZRUSH_COST = 15;
let quizRushTimerHandle = null;

function quizRushPool(){
  return Object.keys(EXERCISES).filter(id=>EXERCISES[id].type==="mc");
}
function startQuizRush(){
  if (!spendForGame("quizrush", QUIZRUSH_COST)) return;
  state.arcadeGame="quizrush";
  state.quizrush = {
    remaining: shuffle(quizRushPool()), score:0, streak:0, lives:3, over:false,
    current:null, duration:9, timeLeft:9, feedback:"", coinsEarned:0,
  };
  nextQuizRushQuestion();
  render();
  startQuizRushTimer();
}
function nextQuizRushQuestion(){
  const q = state.quizrush;
  if (q.remaining.length===0) q.remaining = shuffle(quizRushPool());
  const exId = q.remaining.pop();
  const def = EXERCISES[exId];
  const opts = def.opts.map((text,i)=>({text, correct:i===def.correct}));
  shuffle(opts);
  q.current = {exId, opts, answered:false, pickedIdx:-1};
  q.duration = Math.max(4, 9 - q.streak*0.3);
  q.timeLeft = q.duration;
  q.feedback = "";
}
function startQuizRushTimer(){
  stopQuizRushTimer();
  quizRushTimerHandle = setInterval(()=>{
    const q = state.quizrush;
    if (!q || q.over || (q.current && q.current.answered)) return;
    q.timeLeft -= 0.05;
    if (q.timeLeft<=0) quizRushAnswer(-1);
    renderQuizRushOnly();
  }, 50);
}
function stopQuizRushTimer(){ if (quizRushTimerHandle){ clearInterval(quizRushTimerHandle); quizRushTimerHandle=null; } }
function quizRushAnswer(optIdx){
  const q = state.quizrush;
  if (!q || q.over || q.current.answered) return;
  q.current.answered = true; q.current.pickedIdx = optIdx;
  const picked = optIdx>=0 ? q.current.opts[optIdx] : null;
  if (picked && picked.correct){
    q.streak++;
    const gained = 10 + q.streak*3 + Math.round(q.timeLeft*2);
    q.score += gained;
    q.feedback = `Richtig! +${gained}`;
    const p = progress();
    p.quizRushBestStreak = Math.max(p.quizRushBestStreak||0, q.streak);
    checkAchievements(p);
    setTimeout(()=>{ if(!q.over){ nextQuizRushQuestion(); refreshLiveArea(); } }, 500);
  } else {
    q.streak = 0; q.lives--;
    q.feedback = optIdx<0 ? "Zeit abgelaufen!" : "Leider falsch.";
    if (q.lives<=0){ setTimeout(()=>{ endQuizRush(); refreshLiveArea(); }, 500); }
    else setTimeout(()=>{ if(!q.over){ nextQuizRushQuestion(); refreshLiveArea(); } }, 900);
  }
  refreshLiveArea();
}
function endQuizRush(){
  const q = state.quizrush, p = progress();
  q.over = true; stopQuizRushTimer();
  if (q.score>p.quizRushHigh) p.quizRushHigh = q.score;
  q.coinsEarned = payoutForGame(q.score);
}
function restartQuizRush(){
  state.quizrush = {
    remaining: shuffle(quizRushPool()), score:0, streak:0, lives:3, over:false,
    current:null, duration:9, timeLeft:9, feedback:"", coinsEarned:0,
  };
  nextQuizRushQuestion(); render(); startQuizRushTimer();
}

function renderQuizRushGame(){
  const q = state.quizrush;
  let html = `<div style="text-align:center;">
  <div style="display:flex; align-items:center; justify-content:center; gap:20px; margin-bottom:14px;">
    <button class="btn btn-secondary" onclick="exitArcadeGame()">← Arcade verlassen</button>
    <div class="title" style="margin:0;">🚀 Quiz Rush</div>
  </div>
  <div style="display:flex; justify-content:center; gap:8px; margin-bottom:14px;">
    <span class="pill">🎯 ${q.score} Punkte</span><span class="pill">🔥 Serie x${q.streak}</span>
    <span class="pill">❤️ ${q.lives}</span><span class="pill">🏆 ${progress().quizRushHigh}</span>
  </div>
  <div class="card" style="width:480px; display:inline-block; padding:26px; text-align:left;">`;
  if (!q.over){
    const pct = Math.max(0, Math.min(100, 100*q.timeLeft/q.duration));
    const def = EXERCISES[q.current.exId];
    html += `<div class="progressbar-track" style="margin-bottom:16px;"><div class="progressbar-fill" style="width:${pct}%;"></div></div>
    <div class="section-title">${escapeHtml(def.q)}</div>`;
    q.current.opts.forEach((o,i)=>{
      let cls = "quizrush-opt";
      if (q.current.answered){
        if (o.correct) cls += " right";
        else if (i===q.current.pickedIdx) cls += " wrong";
      }
      html += `<button class="${cls}" ${q.current.answered?"disabled":""} onclick="quizRushAnswer(${i})">${escapeHtml(o.text)}</button>`;
    });
    if (q.feedback) html += `<div class="body-text" style="margin-top:8px;">${escapeHtml(q.feedback)}</div>`;
  } else {
    html += `<div class="title">🎉 Runde beendet!</div>
    <div class="body-text">Punktzahl: ${q.score}</div>
    <div style="color:var(--coin); margin:6px 0 20px;">+${q.coinsEarned} Coins verdient</div>
    <button class="btn btn-primary" onclick="restartQuizRush()" style="margin-right:10px;">Nochmal spielen</button>
    <button class="btn btn-secondary" onclick="exitArcadeGame()">Zurück zur Arcade</button>`;
  }
  return html+`</div></div>`;
}
function renderQuizRushOnly(){
  if (state.page==="games" && state.gamesTab==="arcade" && state.arcadeGame==="quizrush") refreshLiveArea();
}
