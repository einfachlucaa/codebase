/* ---------- ARCADE: BUBBLE SHOOTER ---------- */
const BUBBLE_COLORS = ["#ff5c7a","#4cc9f0","#39d98a","#ffca3a","#7c5cff","#ff9f45"];
const BUBBLE_COST = 20;

function startBubble(){
  if (!spendForGame("bubble", BUBBLE_COST)) return;
  state.arcadeGame="bubble";
  state.bubble = {rows:6, cols:8, cells:[], score:0, level:1, combo:0, over:false, msg:"Klicke auf eine Kugel, um verbundene Kugeln gleicher Farbe zu poppen!", coinsEarned:0};
  buildBubbleBoard();
  render();
}
function bubbleColorCount(){ return Math.min(3+(state.bubble.level-1), BUBBLE_COLORS.length); }
function buildBubbleBoard(){
  const b = state.bubble;
  const n = bubbleColorCount();
  b.cells = [];
  for (let i=0;i<b.rows*b.cols;i++) b.cells.push({color:BUBBLE_COLORS[Math.floor(Math.random()*n)], popped:false});
  if (!bubbleHasMove()) buildBubbleBoard();
}
function bubbleAt(r,c){ const b=state.bubble; if(r<0||r>=b.rows||c<0||c>=b.cols) return null; return b.cells[r*b.cols+c]; }
function bubbleGroup(r,c){
  const b = state.bubble;
  const start = bubbleAt(r,c);
  if (!start||start.popped) return [];
  const color = start.color, visited=new Set(), stack=[[r,c]], result=[];
  while(stack.length){
    const [rr,cc]=stack.pop();
    const idx = rr*b.cols+cc;
    if (rr<0||rr>=b.rows||cc<0||cc>=b.cols) continue;
    const cell = b.cells[idx];
    if (!cell||cell.popped||cell.color!==color) continue;
    if (visited.has(idx)) continue;
    visited.add(idx); result.push(idx);
    stack.push([rr-1,cc],[rr+1,cc],[rr,cc-1],[rr,cc+1]);
  }
  return result;
}
function bubbleHasMove(){
  const b = state.bubble;
  const seen = new Set();
  for (let i=0;i<b.cells.length;i++){
    if (b.cells[i].popped||seen.has(i)) continue;
    const r=Math.floor(i/b.cols), c=i%b.cols;
    const g = bubbleGroup(r,c);
    g.forEach(x=>seen.add(x));
    if (g.length>=2) return true;
  }
  return false;
}
function popBubble(i){
  const b = state.bubble;
  if (b.over||b.cells[i].popped) return;
  const r=Math.floor(i/b.cols), c=i%b.cols;
  const group = bubbleGroup(r,c);
  if (group.length<2){ b.combo=0; b.msg="Keine gleichfarbigen Nachbarn — versuch eine andere Gruppe!"; render(); return; }
  b.combo++;
  const gained = group.length*10 + (b.combo-1)*5;
  b.score += gained;
  group.forEach(idx=>b.cells[idx].popped=true);
  b.msg = `+${gained} Punkte! ${group.length} Kugeln gepoppt (Combo x${b.combo}).`;
  if (b.cells.every(x=>x.popped)){
    b.level++; b.msg=`🎉 Level ${b.level}! Neues Spielfeld.`; buildBubbleBoard(); render(); return;
  }
  if (!bubbleHasMove()) endBubble();
  render();
}
function endBubble(){
  const b = state.bubble, p = progress();
  b.over = true;
  b.msg = `Spiel vorbei! Keine Züge mehr übrig. Endpunktzahl: ${b.score}`;
  if (b.score>p.bubbleHigh) p.bubbleHigh = b.score;
  b.coinsEarned = payoutForGame(b.score);
}
function restartBubble(){
  state.bubble = {rows:6, cols:8, cells:[], score:0, level:1, combo:0, over:false, msg:"Klicke auf eine Kugel, um verbundene Kugeln gleicher Farbe zu poppen!", coinsEarned:0};
  buildBubbleBoard(); render();
}

function renderBubbleGame(){
  const b = state.bubble;
  let html = `<div style="text-align:center;">
  <div style="display:flex; align-items:center; justify-content:center; gap:20px; margin-bottom:14px;">
    <button class="btn btn-secondary" onclick="exitArcadeGame()">← Arcade verlassen</button>
    <div class="title" style="margin:0;">🫧 Bubble Shooter</div>
  </div>
  <div style="display:flex; justify-content:center; gap:8px; margin-bottom:14px;">
    <span class="pill">🎯 ${b.score} Punkte</span><span class="pill">📶 Level ${b.level}</span>
    <span class="pill">🔥 Combo x${b.combo}</span><span class="pill">🏆 ${progress().bubbleHigh}</span>
  </div>
  <div class="body-text" style="margin-bottom:14px;">${escapeHtml(b.msg)}</div>
  <div class="card" style="display:inline-block;">`;
  if (!b.over){
    html += `<div class="bubble-grid">`;
    b.cells.forEach((cell,i)=>{
      html += `<button class="bubble ${cell.popped?'popped':''}" style="background:${cell.color};" onclick="popBubble(${i})"></button>`;
    });
    html += `</div>`;
  } else {
    html += `<div style="width:420px; padding:20px;">
      <div class="title">🎉 Runde beendet!</div>
      <div class="body-text">Punktzahl: ${b.score}</div>
      <div style="color:var(--coin); margin:6px 0 20px;">+${b.coinsEarned} Coins verdient</div>
      <button class="btn btn-primary" onclick="restartBubble()" style="margin-right:10px;">Nochmal spielen</button>
      <button class="btn btn-secondary" onclick="exitArcadeGame()">Zurück zur Arcade</button>
    </div>`;
  }
  return html+`</div></div>`;
}
