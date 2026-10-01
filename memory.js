/* ---------- ARCADE: MEMORY MATCH ----------
   Finde die zusammengehörigen Paare aus C#-Begriff und Erklärung.
   Je weniger Fehlversuche, desto mehr Punkte. */
const MEMORY_COST = 15;
const MEMORY_PAIR_COUNT = 8; // 8 Paare = 16 Karten (4x4 Raster)
let memoryFlipTimeout = null;

function startMemory(){
  if (!spendForGame("memory")) return;
  state.arcadeGame="memory";
  buildMemoryBoard();
  render();
}
function buildMemoryBoard(){
  const chosen = pickRandom(MEMORY_PAIRS, MEMORY_PAIR_COUNT);
  let cards = [];
  chosen.forEach((pair, i)=>{
    cards.push({key:"t"+i, pairId:i, text:pair.term, revealed:false, matched:false});
    cards.push({key:"d"+i, pairId:i, text:pair.def, revealed:false, matched:false});
  });
  shuffle(cards);
  state.memory = {
    cards, flipped:[], matches:0, totalPairs:chosen.length,
    mismatches:0, score:0, over:false, locked:false,
    msg:"Finde jeweils Begriff und passende Erklärung.", xpEarned:0, startedAt:Date.now(),
  };
}
function flipMemoryCard(idx){
  const m = state.memory;
  if (!m || m.over || m.locked) return;
  const c = m.cards[idx];
  if (c.revealed || c.matched) return;
  c.revealed = true;
  m.flipped.push(idx);
  render();
  if (m.flipped.length===2){
    m.locked = true;
    const [i1,i2] = m.flipped;
    const c1 = m.cards[i1], c2 = m.cards[i2];
    if (c1.pairId===c2.pairId){
      c1.matched = true; c2.matched = true;
      m.matches++;
      m.score += 25;
      m.flipped = []; m.locked = false;
      m.msg = "Treffer! ✅";
      if (m.matches>=m.totalPairs) endMemory();
      render();
    } else {
      m.mismatches++;
      m.msg = "Kein Paar — merk dir die Karten!";
      memoryFlipTimeout = setTimeout(()=>{
        c1.revealed = false; c2.revealed = false;
        m.flipped = []; m.locked = false;
        render();
      }, 800);
      render();
    }
  }
}
function endMemory(){
  const m = state.memory, p = progress();
  m.over = true;
  const bonus = Math.max(0, (m.totalPairs*2 - m.mismatches))*10;
  m.score += bonus;
  m.msg = `🎉 Alle Paare gefunden! ${m.mismatches} Fehlversuch(e).`;
  if (m.score>p.memoryHigh) p.memoryHigh = m.score;
  if (m.mismatches===0) p.memoryPerfect = (p.memoryPerfect||0)+1;
  m.xpEarned = payoutForGame(m.score) + awardPlaytimeXp(m.startedAt);
}
function restartMemory(){
  if (memoryFlipTimeout){ clearTimeout(memoryFlipTimeout); memoryFlipTimeout=null; }
  buildMemoryBoard(); render();
}

function renderMemoryGame(){
  const m = state.memory;
  let html = `<div style="text-align:center;">
  <div style="display:flex; align-items:center; justify-content:center; gap:20px; margin-bottom:14px;">
    <button class="btn btn-secondary" onclick="exitArcadeGame()">← Arcade verlassen</button>
    <div class="title" style="margin:0;">🧠 Memory Match</div>
  </div>
  <div style="display:flex; justify-content:center; gap:8px; margin-bottom:14px;">
    <span class="pill">🎯 ${m.score} Punkte</span><span class="pill">✅ ${m.matches}/${m.totalPairs} Paare</span>
    <span class="pill">❌ ${m.mismatches} Fehlversuche</span><span class="pill">🏆 ${progress().memoryHigh}</span>
  </div>
  <div class="body-text" style="margin-bottom:14px;">${escapeHtml(m.msg)}</div>
  <div class="card" style="display:inline-block;">`;
  if (!m.over){
    html += `<div class="memory-grid">`;
    m.cards.forEach((c,i)=>{
      const shown = c.revealed || c.matched;
      const cls = c.matched ? "matched" : (c.revealed ? "revealed" : "");
      html += `<button class="memory-card ${cls}" onclick="flipMemoryCard(${i})">${shown ? escapeHtml(c.text) : '<span class="back-icon">❔</span>'}</button>`;
    });
    html += `</div>`;
  } else {
    html += `<div style="width:420px; padding:20px;">
      <div class="title">🎉 Runde beendet!</div>
      <div class="body-text">Punktzahl: ${m.score} · Fehlversuche: ${m.mismatches}</div>
      <div style="color:var(--xp); margin:6px 0 20px;">+${m.xpEarned} XP verdient</div>
      <button class="btn btn-primary" onclick="restartMemory()" style="margin-right:10px;">Nochmal spielen</button>
      <button class="btn btn-secondary" onclick="exitArcadeGame()">Zurück zur Arcade</button>
    </div>`;
  }
  return html+`</div></div>`;
}
