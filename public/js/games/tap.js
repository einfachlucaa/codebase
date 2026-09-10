/* ---------- ARCADE: TAPTAP ARROW ---------- */
const TAP_COST = 10;
let tapTimerHandle = null;

function startTap(){
  if (!spendForGame("tap", TAP_COST)) return;
  state.arcadeGame="tap";
  state.tap = {score:0, combo:0, lives:3, over:false, dir:"Up", duration:2.2, timeLeft:2.2, feedback:"", coinsEarned:0};
  nextTapRound();
  render();
  startTapTimer();
}
function startTapTimer(){
  stopTapTimer();
  tapTimerHandle = setInterval(()=>{
    if (!state.tap || state.tap.over) return;
    state.tap.timeLeft -= 0.05;
    if (state.tap.timeLeft<=0) tapLoseLife("Zu langsam!");
    renderTapOnly();
  }, 50);
}
function stopTapTimer(){ if (tapTimerHandle){ clearInterval(tapTimerHandle); tapTimerHandle=null; } }
function nextTapRound(){
  const dirs=["Up","Down","Left","Right"];
  state.tap.dir = dirs[Math.floor(Math.random()*4)];
  state.tap.duration = Math.max(0.7, 2.2 - state.tap.combo*0.08);
  state.tap.timeLeft = state.tap.duration;
}
function tapAnswer(dir){
  const t = state.tap;
  if (!t||t.over) return;
  if (dir===t.dir){
    t.combo++; const gained = 10+t.combo*2; t.score+=gained; t.feedback=`Richtig! +${gained}`;
    nextTapRound(); render();
  } else {
    tapLoseLife("Falsche Richtung!");
  }
}
function tapLoseLife(reason){
  const t = state.tap;
  t.combo=0; t.lives--; t.feedback=reason;
  if (t.lives<=0) endTap(); else nextTapRound();
  render();
}
function endTap(){
  const t = state.tap, p = progress();
  t.over=true; stopTapTimer();
  t.feedback = `Spiel vorbei! Endpunktzahl: ${t.score}`;
  if (t.score>p.tapHigh) p.tapHigh=t.score;
  t.coinsEarned = payoutForGame(t.score);
}
function restartTap(){
  state.tap = {score:0, combo:0, lives:3, over:false, dir:"Up", duration:2.2, timeLeft:2.2, feedback:"", coinsEarned:0};
  nextTapRound(); render(); startTapTimer();
}

document.addEventListener("keydown",(e)=>{
  if (state.page==="arcade" && state.arcadeGame==="tap" && state.tap && !state.tap.over){
    const map = {ArrowUp:"Up",ArrowDown:"Down",ArrowLeft:"Left",ArrowRight:"Right"};
    if (map[e.key]){ tapAnswer(map[e.key]); e.preventDefault(); }
  }
});

function renderTapGame(){
  const t = state.tap;
  const pct = Math.max(0, Math.min(100, 100*t.timeLeft/t.duration));
  const glyphs = {Up:"⬆️",Down:"⬇️",Left:"⬅️",Right:"➡️"};
  let html = `<div style="text-align:center;">
  <div style="display:flex; align-items:center; justify-content:center; gap:20px; margin-bottom:14px;">
    <button class="btn btn-secondary" onclick="exitArcadeGame()">← Arcade verlassen</button>
    <div class="title" style="margin:0;">⚡ TapTap Arrow</div>
  </div>
  <div style="display:flex; justify-content:center; gap:8px; margin-bottom:14px;">
    <span class="pill">🎯 ${t.score} Punkte</span><span class="pill">🔥 Combo x${t.combo}</span>
    <span class="pill">❤️ ${t.lives}</span><span class="pill">🏆 ${progress().tapHigh}</span>
  </div>
  <div class="card" style="width:460px; display:inline-block; padding:30px;">`;
  if (!t.over){
    html += `<div class="progressbar-track" style="width:400px; margin:0 auto 20px;"><div class="progressbar-fill" style="width:${pct}%;"></div></div>
    <div class="arrow-glyph">${glyphs[t.dir]}</div>
    <div class="body-text">${escapeHtml(t.feedback)}</div>
    <div class="arrow-pad">
      <div></div><button class="btn btn-secondary" onclick="tapAnswer('Up')">⬆️</button><div></div>
      <button class="btn btn-secondary" onclick="tapAnswer('Left')">⬅️</button>
      <button class="btn btn-secondary" onclick="tapAnswer('Down')">⬇️</button>
      <button class="btn btn-secondary" onclick="tapAnswer('Right')">➡️</button>
    </div>
    <div class="muted" style="margin-top:14px;">Tipp: Du kannst auch die Pfeiltasten der Tastatur benutzen.</div>`;
  } else {
    html += `<div class="title">🎉 Runde beendet!</div>
    <div class="body-text">Punktzahl: ${t.score}</div>
    <div style="color:var(--coin); margin:6px 0 20px;">+${t.coinsEarned} Coins verdient</div>
    <button class="btn btn-primary" onclick="restartTap()" style="margin-right:10px;">Nochmal spielen</button>
    <button class="btn btn-secondary" onclick="exitArcadeGame()">Zurück zur Arcade</button>`;
  }
  return html+`</div></div>`;
}
function renderTapOnly(){
  // Leichter Refresh nur für den Timer-Tick, ohne komplettes Re-Render der ganzen Seite (Performance).
  if (state.page==="arcade" && state.arcadeGame==="tap") render();
}
