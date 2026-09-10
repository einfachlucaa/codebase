/* ---------- RENDER: AUTH ---------- */
function renderBoot(){
  return `<div class="auth-wrap"><div class="card auth-card" style="text-align:center;">
    <div style="font-size:40px;">🎓</div>
    <div class="body-text">Lade...</div>
  </div></div>`;
}
function renderAuth(){
  const err = state.authError ? `<div class="error-text">${escapeHtml(state.authError)}</div>` : `<div class="error-text"></div>`;
  const busy = state.authBusy;
  if (state.authMode==="login"){
    return `
    <div class="auth-wrap"><div class="card auth-card">
      <div style="font-size:40px;">🎓</div>
      <div class="title">Willkommen zurück!</div>
      <div class="body-text" style="margin-bottom:20px;">Melde dich mit deinem Konto an — dein Fortschritt wird in der Datenbank gespeichert.</div>
      <div class="field-label">Nutzername</div>
      <input id="loginUser" type="text" placeholder="dein Nutzername" autocomplete="username"/>
      <div class="field-label" style="margin-top:10px;">Passwort</div>
      <input id="loginPass" type="password" placeholder="dein Passwort" autocomplete="current-password"
        onkeydown="if(event.key==='Enter')doLogin(document.getElementById('loginUser').value, document.getElementById('loginPass').value)"/>
      ${err}
      <button class="btn btn-primary" style="width:100%; margin:14px 0;" ${busy?"disabled":""}
        onclick="doLogin(document.getElementById('loginUser').value, document.getElementById('loginPass').value)">${busy?"Anmelden...":"Anmelden"}</button>
      <div class="muted">Noch kein Konto? <button class="btn-ghost" onclick="setAuthMode('register')">Jetzt registrieren</button></div>
    </div></div>`;
  }
  return `
  <div class="auth-wrap"><div class="card auth-card">
    <div style="font-size:40px;">🚀</div>
    <div class="title">Konto erstellen</div>
    <div class="body-text" style="margin-bottom:20px;">Nutzername: 3-20 Zeichen (Buchstaben/Zahlen/_). Passwort: mind. 6 Zeichen.</div>
    <div class="field-label">Nutzername</div>
    <input id="regUser" type="text" placeholder="z.B. Max" autocomplete="username"/>
    <div class="field-label" style="margin-top:10px;">Passwort</div>
    <input id="regPass" type="password" placeholder="Passwort" autocomplete="new-password"/>
    <div class="field-label" style="margin-top:10px;">Passwort wiederholen</div>
    <input id="regPass2" type="password" placeholder="Passwort wiederholen" autocomplete="new-password"
      onkeydown="if(event.key==='Enter')doRegister(document.getElementById('regUser').value, document.getElementById('regPass').value, document.getElementById('regPass2').value)"/>
    ${err}
    <button class="btn btn-primary" style="width:100%; margin:14px 0;" ${busy?"disabled":""}
      onclick="doRegister(document.getElementById('regUser').value, document.getElementById('regPass').value, document.getElementById('regPass2').value)">${busy?"Erstelle Konto...":"Registrieren"}</button>
    <div class="muted">Schon ein Konto? <button class="btn-ghost" onclick="setAuthMode('login')">Zum Login</button></div>
  </div></div>`;
}

/* ---------- RENDER: SHELL ---------- */
function renderShell(inner){
  const u = state.users[state.currentUser];
  const items = [
    ["dashboard","🏠  Dashboard"], ["learning","📚  C# Lernen"], ["exercises","🎯  Aufgaben"],
    ["achievements","🏆  Erfolge"], ["arcade","🎮  Arcade"], ["casino","🎰  Casino"],
    ["shop","🛒  Shop"], ["friends","👥  Freunde"],
    ["leaderboard","🥇  Leaderboard"], ["profile","👤  Profil"], ["settings","⚙️  Einstellungen"],
  ];
  if (isAdminUser() || hasPermission("users.view")) items.push(["admin","🛡️  Admin-Panel"]);
  const roleLabel = u.role==="admin" ? "Admin" : u.role==="moderator" ? "Moderator" : "Angemeldet";
  const nav = items.map(([k,label])=>`<button class="nav-item ${state.page===k?'active':''}" onclick="goto('${k}')">${label}</button>`).join("");
  return `
  <div class="shell">
    <div class="sidebar">
      <div class="brand"><h1>🎓 C# Quest</h1><p>Lerne C# spielerisch</p></div>
      <div class="user-chip"><span class="av">${u.avatar}</span><div><div style="font-weight:600; font-size:13px;">${escapeHtml(state.currentUser)}</div><div class="muted">${roleLabel}</div></div>
        <button class="btn-ghost" style="margin-left:auto;" title="Sound an/aus" onclick="toggleSound()">${state.soundOn?"🔊":"🔇"}</button>
      </div>
      <div style="margin-top:16px;">${nav}</div>
    </div>
    <div class="content">
      ${u.warnings && u.warnings.length>0 ? `<div class="warn-banner" style="margin-bottom:16px;">⚠️ Du hast ${u.warnings.length} Verwarnung(en) erhalten. Letzter Grund: "${escapeHtml(u.warnings[u.warnings.length-1].reason)}". Bei weiteren Verstößen wird dein Konto automatisch gesperrt.</div>` : ""}
      ${inner}
    </div>
  </div>`;
}

/* ---------- RENDER: DASHBOARD ---------- */
function renderDashboard(){
  const p = progress();
  const u = state.users[state.currentUser];
  const need = xpForLevel(p.level);
  const pct = Math.min(100, Math.round(100*p.xp/need));
  const completed = p.completedLessons.length, total = LESSONS.length;
  const coursePct = Math.round(100*completed/total);
  const nextLesson = LESSONS.find(l=>lessonUnlocked(l,p) && !p.completedLessons.includes(l.id));
  return `
  <div style="display:flex; align-items:center; margin-bottom:24px;">
    <div class="gradient-bg" style="border-radius:30px; width:60px; height:60px; display:flex; align-items:center; justify-content:center; font-size:30px;">${u.avatar}</div>
    <div style="margin-left:16px;">
      <div class="title">Willkommen zurück, ${escapeHtml(state.currentUser)}! 👋</div>
      <div class="body-text">Lerne C# spielerisch und werde jeden Tag besser.</div>
    </div>
  </div>
  <div class="stat-grid">
    <div class="card"><div class="muted">⭐ LEVEL</div><div style="font-size:28px; font-weight:700;">${p.level}</div>
      <div class="progressbar-track" style="margin-top:8px;"><div class="progressbar-fill" style="width:${pct}%;"></div></div>
      <div class="muted" style="margin-top:4px;">${p.xp} / ${need} XP</div></div>
    <div class="card"><div class="muted">🪙 COINS</div><div style="font-size:28px; font-weight:700; color:var(--coin);">${p.coins}</div>
      <div class="muted" style="margin-top:20px;">Für die Arcade ausgeben</div></div>
    <div class="card"><div class="muted">💎 GEMS</div><div style="font-size:28px; font-weight:700; color:#7fd8f5;">${p.gems}</div>
      <div class="muted" style="margin-top:20px;">Selten — nur durch schwere Erfolge</div></div>
    <div class="card"><div class="muted">🔥 STREAK</div><div style="font-size:28px; font-weight:700; color:var(--warning);">${p.streak} Tage</div>
      <div class="muted" style="margin-top:20px;">Lerne jeden Tag weiter!</div></div>
    <div class="card"><div class="muted">📚 LERNFORTSCHRITT</div><div style="font-size:28px; font-weight:700;">${completed}/${total}</div>
      <div class="muted" style="margin-top:20px;">${coursePct}% abgeschlossen</div></div>
  </div>
  <div class="two-col">
    <div class="card gradient-bg">
      <div style="font-size:11px; color:#ddd; font-weight:600;">AKTUELLE LEKTION</div>
      <div style="font-size:22px; font-weight:700; color:white; margin:6px 0 16px;">${nextLesson?escapeHtml(nextLesson.title):"Alle Lektionen abgeschlossen! 🎉"}</div>
      <button class="btn" style="background:white; color:#7c5cff;" onclick="goto('learning')">Weiterlernen ▶</button>
    </div>
    <div class="card">
      <div class="muted">🎯 TAGESZIEL</div>
      <div class="body-text" style="margin:8px 0 12px;">${p.daily.exToday}/3 Aufgaben · ${p.daily.xpToday}/100 XP heute</div>
      ${(p.daily.exToday>=3||p.daily.xpToday>=100||p.daily.lessonsToday>=1) && !p.daily.claimed ?
        `<button class="btn btn-primary" onclick="claimDaily()">+100 Coins abholen</button>` : ""}
    </div>
  </div>
  <div class="section-title">Schnellzugriff</div>
  <div class="quick-grid">
    <button class="btn btn-secondary" style="padding:16px 20px;" onclick="goto('learning')">📚 C# lernen</button>
    <button class="btn btn-secondary" style="padding:16px 20px;" onclick="goto('exercises')">🎯 Aufgaben</button>
    <button class="btn btn-secondary" style="padding:16px 20px;" onclick="goto('arcade')">🎮 Minispiele</button>
    <button class="btn btn-secondary" style="padding:16px 20px;" onclick="goto('leaderboard')">🥇 Leaderboard</button>
  </div>
  <div class="warn-banner" style="margin-top:24px;">✅ Dein Fortschritt wird automatisch in der Datenbank gespeichert — du kannst dich von jedem Gerät aus wieder einloggen.</div>
  `;
}
function claimDaily(){
  const p=progress();
  // Sicherheitsfix: Guard gegen Mehrfachaufruf (z.B. über die Browser-Konsole).
  if (p.daily.claimed) return;
  const unlocked = p.daily.exToday>=3 || p.daily.xpToday>=100 || p.daily.lessonsToday>=1;
  if (!unlocked) return;
  p.daily.claimed=true; addCoins(p,100); playSound("coin"); render();
}

/* ---------- RENDER: LEARNING ---------- */
function renderLearning(){
  if (state.lessonId) return renderLessonDetail();
  const p = progress();
  const groups = {};
  LESSONS.forEach(l=>{ (groups[l.grp] ||= []).push(l); });
  let html = `<div class="title">📚 C# lernen</div><div class="body-text" style="margin-bottom:20px;">Arbeite dich Level für Level durch den Kurs.</div>`;
  Object.keys(groups).sort((a,b)=>a-b).forEach(g=>{
    const ls = groups[g];
    const done = ls.filter(l=>p.completedLessons.includes(l.id)).length;
    html += `<div style="margin-bottom:10px; display:flex; align-items:center; gap:10px;">
      <span class="pill gradient-bg" style="color:white; font-weight:700;">LEVEL ${g}</span>
      <span class="section-title" style="margin:0;">${escapeHtml(ls[0].grpTitle)}</span>
      <span class="muted">(${done}/${ls.length})</span></div>`;
    html += `<div class="lesson-grid">`;
    ls.forEach(l=>{
      const unlocked = lessonUnlocked(l,p);
      const done_ = p.completedLessons.includes(l.id);
      html += `<button class="lesson-card" ${unlocked?"":"disabled"} onclick="${unlocked?`openLesson('${l.id}')`:''}">
        <div class="top-row"><span class="icon">${l.icon}</span><span>${done_?"✅":(unlocked?"":"🔒")}</span></div>
        <div class="lname">${escapeHtml(l.title)}</div>
        <div class="muted" style="margin-top:6px;">+${l.xp} XP</div>
      </button>`;
    });
    html += `</div>`;
  });
  return html;
}
function renderLessonDetail(){
  const l = LESSONS.find(x=>x.id===state.lessonId);
  const p = progress();
  const justDone = p.completedLessons.includes(l.id) && state.lessonInstances.every(i=>i.correct);
  let html = `<button class="btn btn-secondary" onclick="backToLessons()" style="margin-bottom:18px;">← Zurück zur Übersicht</button>
  <div style="display:flex; align-items:center; gap:10px;"><span style="font-size:30px;">${l.icon}</span><div class="title">${escapeHtml(l.title)}</div></div>
  <div class="muted" style="margin-bottom:20px;">Kursbereich: ${escapeHtml(l.grpTitle)}</div>
  <div class="card" style="margin-bottom:16px;"><div class="section-title">📖 Erklärung</div><div class="body-text">${escapeHtml(l.explain)}</div></div>
  <div class="card" style="margin-bottom:16px;"><div class="section-title">💻 Beispielcode</div><div class="code-block">${escapeHtml(l.code)}</div><div class="body-text">${escapeHtml(l.codeExplain)}</div></div>
  <div class="two-col">
    <div class="card" style="background:#241e3d;"><div style="font-weight:700; color:var(--xp); margin-bottom:8px;">🧠 Merke</div><div class="body-text">${escapeHtml(l.remember)}</div></div>
    <div class="card" style="background:#2e2412;"><div style="font-weight:700; color:var(--warning); margin-bottom:8px;">⚡ Profi-Tipp</div><div class="body-text">${escapeHtml(l.tip)}</div></div>
  </div>`;
  if (justDone){
    html += `<div class="card gradient-bg" style="margin:20px 0; display:flex; align-items:center; gap:14px;"><span style="font-size:30px;">🎉</span>
      <div><div style="font-weight:700; color:white;">Lektion abgeschlossen!</div><div style="color:#ede9ff;">+${l.xp} XP verdient</div></div></div>`;
  }
  html += `<div class="section-title" style="margin-top:20px;">🎯 Aufgaben zu dieser Lektion</div>`;
  state.lessonInstances.forEach((inst,idx)=>{ html += renderExerciseWidget(inst, idx, "lesson"); });
  return html;
}

/* ---------- RENDER: PRACTICE ---------- */
function renderPractice(){
  let xpGained=0, coinsGained=0;
  state.practiceInstances.forEach(i=>{ if(i.correct){ xpGained+=EXERCISES[i.exId].xp; coinsGained+=EXERCISES[i.exId].coins; }});
  let html = `<div class="title">🎯 Aufgaben</div>
  <div class="body-text" style="margin-bottom:16px;">Freies Training: zufällige Aufgaben aus allen Kursbereichen für Extra-XP und Coins.</div>
  <div class="card" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
    <div style="display:flex; gap:24px;">
      <div><div class="muted">XP DIESE RUNDE</div><div style="font-size:20px; font-weight:700; color:var(--xp);">${xpGained}</div></div>
      <div><div class="muted">COINS DIESE RUNDE</div><div style="font-size:20px; font-weight:700; color:var(--coin);">${coinsGained}</div></div>
    </div>
    <button class="btn btn-primary" onclick="loadPractice(); render();">🔀 Neue Aufgaben</button>
  </div>`;
  state.practiceInstances.forEach((inst,idx)=>{ html += renderExerciseWidget(inst, idx, "practice"); });
  return html;
}

/* ---------- RENDER: ACHIEVEMENTS ---------- */
function renderAchievements(){
  const p = progress();
  let html = `<div class="title">🏆 Erfolge</div>
  <div class="body-text" style="margin-bottom:20px;">Du hast <b style="color:var(--success);">${p.unlocked.length}</b> von <b>${ACHIEVEMENTS.length}</b> Erfolgen freigeschaltet.</div>
  <div class="ach-grid">`;
  ACHIEVEMENTS.forEach(a=>{
    const un = p.unlocked.includes(a.id);
    html += `<div class="card"><div style="display:flex; justify-content:space-between;"><span style="font-size:30px;">${a.icon}</span>${un?"":"<span>🔒</span>"}</div>
      <div style="font-weight:600; margin:10px 0 4px;">${escapeHtml(a.title)}</div><div class="muted">${escapeHtml(a.desc)}</div></div>`;
  });
  return html+`</div>`;
}

/* ---------- RENDER: ARCADE ---------- */
const ARCADE_GAMES = [
  {key:"bubble", icon:"🫧", title:"Bubble Shooter", desc:"Poppe verbundene Kugeln gleicher Farbe und sammle Combo-Punkte.", cost:0, high:p=>p.bubbleHigh, start:"startBubble", unlockLevel:1},
  {key:"tap", icon:"⚡", title:"TapTap Arrow", desc:"Reagiere blitzschnell auf die richtige Pfeilrichtung.", cost:15, high:p=>p.tapHigh, start:"startTap", unlockLevel:2},
  {key:"memory", icon:"🧠", title:"Memory Match", desc:"Finde Paare aus C#-Begriff und passender Erklärung.", cost:20, high:p=>p.memoryHigh, start:"startMemory", unlockLevel:3},
  {key:"quizrush", icon:"🚀", title:"Quiz Rush", desc:"Beantworte C#-Fragen im Rennen gegen die Uhr, 3 Leben.", cost:25, high:p=>p.quizRushHigh, start:"startQuizRush", unlockLevel:4},
];
function renderArcade(){
  if (state.arcadeGame==="bubble") return renderBubbleGame();
  if (state.arcadeGame==="tap") return renderTapGame();
  if (state.arcadeGame==="memory") return renderMemoryGame();
  if (state.arcadeGame==="quizrush") return renderQuizRushGame();
  const p = progress();
  let html = `
  <div class="title">🎮 Arcade</div>
  <div class="body-text">Gib deine gesammelten Coins für Minispiele aus! Weitere Spiele schalten sich mit steigendem Level frei.</div>
  <div style="margin:6px 0 20px;">🪙 Dein Guthaben: <b style="color:var(--coin);">${p.coins}</b></div>
  <div class="game-grid">`;
  ARCADE_GAMES.forEach(g=>{
    const levelLocked = p.level < g.unlockLevel;
    const disabled = levelLocked || p.coins<g.cost;
    html += `<div class="card game-card" style="${levelLocked?'opacity:.55;':''}">
      <div class="gicon">${levelLocked?"🔒":g.icon}</div>
      <div class="section-title" style="margin:10px 0 4px;">${escapeHtml(g.title)}</div>
      <div class="body-text">${escapeHtml(g.desc)}</div>
      <div class="muted" style="margin:10px 0 14px;">${levelLocked?`🔒 Ab Level ${g.unlockLevel}`:`🏆 Highscore: ${g.high(p)}`}</div>
      <button class="btn btn-primary" ${disabled?"disabled":""} onclick="${g.start}()">${levelLocked?"Gesperrt":(g.cost===0?"Kostenlos spielen 🎮":`Spielen — ${g.cost} 🪙`)}</button>
    </div>`;
  });
  return html+`</div>`;
}

/* ---------- RENDER: LEADERBOARD ---------- */
const LEADERBOARD_TABS = [
  {key:"xp", label:"⭐ XP"}, {key:"coins", label:"🪙 Coins"}, {key:"gems", label:"💎 Gems"},
  {key:"streak", label:"🔥 Streak"}, {key:"bubble", label:"🫧 Bubble"}, {key:"tap", label:"⚡ TapTap"},
  {key:"memory", label:"🧠 Memory"}, {key:"quizrush", label:"🚀 QuizRush"},
];
function renderLeaderboard(){
  const rows = state.leaderboardRows;
  const tabs = LEADERBOARD_TABS.map(t=>
    `<button class="btn ${state.leaderboardSort===t.key?'btn-primary':'btn-secondary'}" style="padding:8px 14px;" onclick="loadLeaderboard('${t.key}')">${t.label}</button>`
  ).join("");
  const activeLabel = (LEADERBOARD_TABS.find(t=>t.key===state.leaderboardSort)||{}).label || "";
  let html = `<div class="title">🥇 Leaderboard</div>
  <div class="body-text" style="margin-bottom:14px;">Serverweite Ranglisten aus der Datenbank — pro Kategorie und pro Arcade-Spiel.</div>
  <div style="display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap;">${tabs}</div>`;
  if (rows===null){ return html + `<div class="body-text">Lade Rangliste...</div>`; }
  if (rows.length===0){ return html + `<div class="body-text">Noch keine Einträge.</div>`; }
  html += `<div class="card" style="padding:0;"><table class="lb">
    <tr><th></th><th></th><th style="text-align:left;">Spieler</th><th>Level</th><th>${activeLabel}</th></tr>`;
  rows.forEach((r,i)=>{
    const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`;
    html += `<tr class="${r.username===state.currentUser?'me':''}">
      <td>${medal}</td><td style="font-size:20px;">${r.avatar}</td><td><b>${escapeHtml(r.username)}</b></td>
      <td>Lvl ${r.level}</td><td style="color:var(--xp); font-weight:700;">${r.score}</td></tr>`;
  });
  return html+`</table></div>`;
}

/* ---------- RENDER: SHOP ---------- */
function renderShop(){
  const p = progress();
  let html = `<div class="title">🛒 Shop</div>
  <div class="body-text" style="margin-bottom:6px;">Premium-Avatare gegen Coins oder seltene Gems — reine Kosmetik, kein Gameplay-Vorteil.</div>
  <div style="margin:6px 0 20px; display:flex; gap:20px;">
    <span>🪙 Coins: <b style="color:var(--coin);">${p.coins}</b></span>
    <span>💎 Gems: <b style="color:#7fd8f5;">${p.gems}</b></span>
  </div>`;
  if (!state.shop){ return html + `<div class="body-text">Lade Shop...</div>`; }
  const section = (title, items)=>{
    let s = `<div class="section-title" style="margin-top:10px;">${title}</div><div class="ach-grid">`;
    items.forEach(item=>{
      const owned = state.shop.owned.includes(item.avatar);
      const balance = item.currency==="gems" ? p.gems : p.coins;
      const disabled = !owned && balance < item.cost;
      const unit = item.currency==="gems" ? "💎" : "🪙";
      s += `<div class="card" style="text-align:center;">
        <div style="font-size:40px;">${item.avatar}</div>
        <div style="font-weight:600; margin:8px 0 4px;">${escapeHtml(item.name)}</div>
        ${owned
          ? `<button class="btn btn-secondary" onclick="changeAvatar('${item.avatar}')">Ausrüsten</button>`
          : `<button class="btn btn-primary" ${disabled?"disabled":""} onclick="buyShopAvatar('${item.avatar}')">Kaufen — ${item.cost} ${unit}</button>`}
      </div>`;
    });
    return s + `</div>`;
  };
  html += section("🪙 Coin-Avatare", state.shop.coinItems);
  html += section("💎 Gem-Avatare (selten)", state.shop.gemItems);
  return html;
}

/* ---------- RENDER: CASINO (nur virtuelle Coins, kein Echtgeld) ---------- */
function renderCasino(){
  const p = progress();
  const r = state.casinoResult;
  let resultHtml = "";
  if (r && r.game==="coinflip"){
    resultHtml = `<div class="card gradient-bg casino-result-pop" style="margin:16px 0; text-align:center;">
      <div style="font-size:40px;">${r.result==="heads"?"🪙":"🌑"}</div>
      <div style="color:white; font-weight:700; margin-top:6px;">${r.result==="heads"?"Kopf":"Zahl"} — ${r.win?`Gewonnen! +${r.payout} 🪙`:"Verloren"}</div>
    </div>`;
  } else if (r && r.game==="slots"){
    resultHtml = `<div class="card gradient-bg casino-result-pop" style="margin:16px 0; text-align:center;">      <div style="font-size:40px; letter-spacing:10px;">${r.reels.join(" ")}</div>
      <div style="color:white; font-weight:700; margin-top:6px;">${r.payout>0?`Gewonnen! +${r.payout} 🪙`:"Verloren"}</div>
    </div>`;
  }
  return `
  <div class="title">🎰 Casino</div>
  <div class="body-text" style="margin-bottom:6px;">Nur virtuelle Coins, kein Echtgeld — die Ergebnisse werden serverseitig gewürfelt, nicht manipulierbar.</div>
  <div style="margin:6px 0 20px;">🪙 Dein Guthaben: <b style="color:var(--coin);">${p.coins}</b></div>
  ${resultHtml}
  <div class="two-col">
    <div class="card">
      <div class="section-title">🪙 Coinflip</div>
      <div class="body-text" style="margin-bottom:12px;">Kopf oder Zahl — bei Treffer verdoppelter Einsatz.</div>
      <input id="cfBet" type="number" value="20" min="5" max="500" style="width:100px; margin-bottom:10px;"/>
      <div style="display:flex; gap:10px;">
        <button class="btn btn-primary" ${state.casinoBusy?"disabled":""} onclick="playCasinoCoinflip(document.getElementById('cfBet').value,'heads')">Kopf 🪙</button>
        <button class="btn btn-primary" ${state.casinoBusy?"disabled":""} onclick="playCasinoCoinflip(document.getElementById('cfBet').value,'tails')">Zahl 🌑</button>
      </div>
    </div>
    <div class="card">
      <div class="section-title">🎰 Slots</div>
      <div class="body-text" style="margin-bottom:12px;">3 gleiche Symbole = großer Gewinn, 2 gleiche = kleiner Trostgewinn.</div>
      <input id="slBet" type="number" value="20" min="5" max="500" style="width:100px; margin-bottom:10px;"/>
      <div><button class="btn btn-primary" ${state.casinoBusy?"disabled":""} onclick="playCasinoSlots(document.getElementById('slBet').value)">Drehen 🎰</button></div>
    </div>
  </div>`;
}

/* ---------- RENDER: FREUNDE ---------- */
function renderFriends(){
  let html = `<div class="title">👥 Freunde</div>
  <div class="body-text" style="margin-bottom:16px;">Nutzer suchen, Freundschaftsanfragen senden und verwalten.</div>
  <input type="text" placeholder="Nutzer suchen..." style="max-width:280px; margin-bottom:12px;" oninput="searchFriendUsers(this.value)"/>`;
  if (state.friendSearchResults.length){
    html += `<div class="card" style="margin-bottom:20px;">`;
    state.friendSearchResults.forEach(u=>{
      html += `<div style="display:flex; align-items:center; gap:10px; padding:6px 0;">
        <span style="font-size:20px;">${u.avatar}</span><b>${escapeHtml(u.username)}</b><span class="muted">Lvl ${u.progress.level}</span>
        <button class="btn btn-secondary" style="margin-left:auto; padding:6px 12px;" onclick="sendFriendRequest('${u._id}')">+ Anfrage</button>
      </div>`;
    });
    html += `</div>`;
  }
  if (!state.friendsData) return html + `<div class="body-text">Lade Freunde...</div>`;
  const {friends, incoming, outgoing} = state.friendsData;
  if (incoming.length){
    html += `<div class="section-title">Eingehende Anfragen</div><div class="card" style="margin-bottom:20px;">`;
    incoming.forEach(r=>{
      html += `<div style="display:flex; align-items:center; gap:10px; padding:6px 0;">
        <b>${escapeHtml(r.username)}</b>
        <button class="btn btn-primary" style="margin-left:auto; padding:6px 12px;" onclick="respondFriendRequest('${r.user._id||r.user}', true)">Annehmen</button>
        <button class="btn btn-secondary" style="padding:6px 12px;" onclick="respondFriendRequest('${r.user._id||r.user}', false)">Ablehnen</button>
      </div>`;
    });
    html += `</div>`;
  }
  if (outgoing.length){
    html += `<div class="section-title">Gesendete Anfragen</div><div class="card" style="margin-bottom:20px;">`;
    outgoing.forEach(r=>{ html += `<div class="body-text" style="padding:4px 0;">${escapeHtml(r.username)} — ausstehend</div>`; });
    html += `</div>`;
  }
  html += `<div class="section-title">Deine Freunde (${friends.length})</div>`;
  if (!friends.length) return html + `<div class="body-text">Noch keine Freunde — such oben nach jemandem!</div>`;
  html += `<div class="ach-grid">`;
  friends.forEach(f=>{
    html += `<div class="card" style="text-align:center;">
      <div style="font-size:32px;">${f.avatar}</div>
      <div style="font-weight:600; margin:6px 0;">${escapeHtml(f.username)}</div>
      <div class="muted">Level ${f.progress.level}</div>
      <button class="btn btn-secondary" style="margin-top:10px; padding:6px 12px; color:#e05252;" onclick="removeFriendUser('${f._id}')">Entfernen</button>
    </div>`;
  });
  return html + `</div>`;
}

/* ---------- RENDER: ADMIN-PANEL ---------- */
function renderAdmin(){
  const tabBtn = (key,label)=>`<button class="btn ${state.adminTab===key?'btn-primary':'btn-secondary'}" style="padding:8px 14px;" onclick="setAdminTab('${key}')">${label}</button>`;
  let html = `<div class="title">🛡️ Admin-Panel</div>
  <div class="body-text" style="margin-bottom:16px;">Nutzerverwaltung, Rollen, Berechtigungen, Verwarnungen, Sperren und Live-Aktivität.</div>
  <div style="display:flex; gap:8px; margin-bottom:18px;">${tabBtn('users','👥 Nutzer')} ${tabBtn('activity','📜 Aktivität')}</div>`;
  if (state.adminTab==="activity") return html + renderAdminActivity();
  return html + renderAdminUsersTab();
}
function renderAdminUsersTab(){
  let html = `<input type="text" placeholder="Nutzer suchen..." value="${escapeHtml(state.adminQuery||'')}" style="max-width:280px; margin-bottom:16px;"
    oninput="adminSearch(this.value)"/>`;
  if (!state.adminUsers){ return html + `<div class="body-text">Lade Nutzer...</div>`; }
  html += `<div class="card" style="padding:0; overflow-x:auto;"><table class="lb">
    <tr><th style="text-align:left; padding:10px;">Nutzer</th><th>Rolle</th><th>Coins</th><th>Gems</th><th>XP</th><th>Level</th><th>Status</th><th>Aktionen</th></tr>`;
  state.adminUsers.forEach(u=>{
    const isSelf = u.username===state.currentUser;
    html += `<tr>
      <td style="padding:10px;"><span style="font-size:18px;">${u.avatar}</span> <b>${escapeHtml(u.username)}</b>
        ${u.warnings && u.warnings.length ? `<span title="${u.warnings.length} Verwarnung(en)" style="margin-left:4px;">⚠️${u.warnings.length}</span>`:""}
        ${u.flagged ? `<span title="${escapeHtml(u.flagReason||'')}" style="margin-left:4px;">🚩</span>`:""}
      </td>
      <td>
        <select onchange="adminSetRole('${u._id}', this.value)" ${isSelf?"disabled":""}>
          ${(state.adminRoles||["user","moderator","admin"]).map(r=>`<option value="${r}" ${u.role===r?"selected":""}>${r}</option>`).join("")}
        </select>
      </td>
      <td><input type="number" id="coins_${u._id}" value="${u.progress.coins}" style="width:80px;"/></td>
      <td><input type="number" id="gems_${u._id}" value="${u.progress.gems}" style="width:70px;"/></td>
      <td><input type="number" id="xp_${u._id}" value="${u.progress.xp}" style="width:80px;"/></td>
      <td><input type="number" id="level_${u._id}" value="${u.progress.level}" style="width:60px;"/></td>
      <td>${u.banned ? `<span style="color:#e05252;">🚫 Gesperrt</span>` : `<span style="color:var(--success);">✅ Aktiv</span>`}</td>
      <td style="display:flex; gap:6px; flex-wrap:wrap; padding:10px;">
        <button class="btn btn-secondary" style="padding:6px 10px;" onclick="adminEditStats('${u._id}', document.getElementById('coins_${u._id}').value, document.getElementById('xp_${u._id}').value, document.getElementById('level_${u._id}').value, document.getElementById('gems_${u._id}').value)">💾</button>
        <button class="btn btn-secondary" style="padding:6px 10px;" onclick="adminWarnUser('${u._id}')">⚠️ Verwarnen</button>
        ${u.warnings && u.warnings.length ? `<button class="btn btn-secondary" style="padding:6px 10px;" onclick="adminClearWarnings('${u._id}')">Warns löschen</button>`:""}
        ${u.flagged ? `<button class="btn btn-secondary" style="padding:6px 10px; color:#e0a020;" onclick="adminClearFlag('${u._id}')">🚩 Entwarnen</button>`:""}
        <button class="btn btn-secondary" style="padding:6px 10px;" ${isSelf?"disabled":""} onclick="adminSetBanned('${u._id}', ${!u.banned})">${u.banned?"Entsperren":"Sperren"}</button>
        <button class="btn btn-secondary" style="padding:6px 10px; color:#e05252;" ${isSelf?"disabled":""} onclick="adminDeleteUser('${u._id}', '${escapeHtml(u.username)}')">🗑️</button>
      </td>
    </tr>`;
  });
  html += `</table></div>`;
  html += `<div class="section-title" style="margin-top:24px;">Individuelle Permissions (zusätzlich zur Rolle)</div>
  <div class="body-text" style="margin-bottom:12px;">Für Sonderfälle: einem "user" oder "moderator" gezielt einzelne Admin-Rechte geben, ohne die ganze Rolle zu ändern.</div>
  <div class="card" style="padding:0; overflow-x:auto;"><table class="lb">
    <tr><th style="text-align:left; padding:10px;">Nutzer</th>${(state.adminPermissionList||[]).map(p=>`<th>${p}</th>`).join("")}</tr>`;
  state.adminUsers.forEach(u=>{
    html += `<tr><td style="padding:10px;"><b>${escapeHtml(u.username)}</b></td>`;
    (state.adminPermissionList||[]).forEach(perm=>{
      const checked = (u.permissions||[]).includes(perm);
      html += `<td style="text-align:center;"><input type="checkbox" ${checked?"checked":""} ${u.role==='admin'?"disabled":""}
        onchange="adminTogglePermission('${u._id}', '${perm}', this.checked)"/></td>`;
    });
    html += `</tr>`;
  });
  return html+`</table></div>`;
}
function renderAdminActivity(){
  if (!state.adminActivity){ return `<div class="body-text">Lade Aktivität...</div>`; }
  const ICONS = {register:"🆕",login:"🔑",ban:"🚫",unban:"✅",warn:"⚠️",role_change:"🛡️",shop_purchase:"🛒",casino_bet:"🎰",cheat_flag:"🚩",friend_request:"👥",friend_accept:"🤝"};
  let html = `<div class="body-text" style="margin-bottom:14px;">Die letzten 200 Ereignisse serverweit (Logins, Käufe, Verwarnungen, Casino-Wetten, Cheat-Flags ...).</div>
  <div class="card" style="padding:0;"><table class="lb">
    <tr><th style="text-align:left; padding:10px;">Zeit</th><th style="text-align:left;">Nutzer</th><th style="text-align:left;">Ereignis</th><th style="text-align:left;">Details</th></tr>`;
  state.adminActivity.forEach(log=>{
    const time = new Date(log.createdAt).toLocaleString('de-DE');
    html += `<tr><td style="padding:8px 10px; white-space:nowrap;" class="muted">${time}</td>
      <td><b>${escapeHtml(log.username||"?")}</b></td>
      <td>${ICONS[log.type]||"•"} ${log.type}</td>
      <td class="muted">${escapeHtml(JSON.stringify(log.meta||{}))}</td></tr>`;
  });
  return html+`</table></div>`;
}

/* ---------- RENDER: PROFILE ---------- */
function renderProfile(){
  const p = progress();
  const u = state.users[state.currentUser];
  const avatars = AVATARS.map(a=>`<button class="btn btn-secondary avatar-pick" onclick="changeAvatar('${a}')">${a}</button>`).join("");
  return `
  <div class="title">👤 Profil</div>
  <div class="two-col">
    <div class="card" style="text-align:center;">
      <div class="gradient-bg" style="border-radius:50px; width:100px; height:100px; margin:0 auto; display:flex; align-items:center; justify-content:center; font-size:50px;">${u.avatar}</div>
      <div class="section-title" style="margin-top:14px;">${escapeHtml(state.currentUser)}</div>
      <div class="muted" style="margin-bottom:16px;">Dabei seit ${new Date(u.createdAt).toLocaleDateString('de-DE')}</div>
      <div class="muted" style="margin-bottom:8px;">Avatar wählen:</div>
      <div>${avatars}</div>
    </div>
    <div class="card">
      <div class="section-title">📊 Lernstatistik</div>
      <div class="quick-grid" style="grid-template-columns:repeat(2,1fr);">
        <div><div class="muted">LEVEL</div><div style="font-size:20px; font-weight:700;">${p.level}</div></div>
        <div><div class="muted">COINS</div><div style="font-size:20px; font-weight:700; color:var(--coin);">${p.coins}</div></div>
        <div><div class="muted">GEMS</div><div style="font-size:20px; font-weight:700; color:#7fd8f5;">${p.gems}</div></div>
        <div><div class="muted">LERNSERIE</div><div style="font-size:20px; font-weight:700; color:var(--warning);">${p.streak} Tage</div></div>
        <div><div class="muted">LEKTIONEN</div><div style="font-size:20px; font-weight:700;">${p.completedLessons.length}/${LESSONS.length}</div></div>
        <div><div class="muted">GELÖSTE AUFGABEN</div><div style="font-size:20px; font-weight:700;">${p.totalSolved}</div></div>
        <div><div class="muted">BESTE SERIE</div><div style="font-size:20px; font-weight:700;">${p.bestStreak}</div></div>
        <div><div class="muted">ERFOLGE</div><div style="font-size:20px; font-weight:700;">${p.unlocked.length}/${ACHIEVEMENTS.length}</div></div>
      </div>
    </div>
  </div>
  <div class="section-title" style="margin-top:20px;">🎮 Highscores</div>
  <div class="quick-grid" style="grid-template-columns:repeat(4,1fr);">
    <div class="card" style="display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;"><span style="font-size:26px;">🫧</span><div>Bubble Shooter</div><div style="font-size:18px; font-weight:700; color:var(--xp);">${p.bubbleHigh}</div></div>
    <div class="card" style="display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;"><span style="font-size:26px;">⚡</span><div>TapTap Arrow</div><div style="font-size:18px; font-weight:700; color:var(--xp);">${p.tapHigh}</div></div>
    <div class="card" style="display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;"><span style="font-size:26px;">🧠</span><div>Memory Match</div><div style="font-size:18px; font-weight:700; color:var(--xp);">${p.memoryHigh}</div></div>
    <div class="card" style="display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center;"><span style="font-size:26px;">🚀</span><div>Quiz Rush</div><div style="font-size:18px; font-weight:700; color:var(--xp);">${p.quizRushHigh}</div></div>
  </div>`;
}

/* ---------- RENDER: SETTINGS ---------- */
function renderSettings(){
  const u = state.users[state.currentUser];
  return `
  <div class="title">⚙ Einstellungen</div>
  <div class="card" style="width:480px; margin-bottom:16px;">
    <div class="section-title">Konto</div>
    <div class="body-text" style="margin-bottom:6px;">Nutzername: <b>${escapeHtml(state.currentUser)}</b></div>
    <div class="body-text" style="margin-bottom:6px;">Rolle: <b>${escapeHtml(u.role)}</b></div>
    <div class="body-text" style="margin-bottom:12px;">Dein Fortschritt wird automatisch in MongoDB gespeichert und bei jedem Login geladen.</div>
    <button class="btn btn-secondary" onclick="logout()">Abmelden</button>
  </div>
  <div class="card" style="width:480px; margin-bottom:16px;">
    <div class="section-title">Lokales Backup</div>
    <div class="body-text" style="margin-bottom:14px;">Optional: zusätzliche Sicherungskopie deines Fortschritts als Datei herunterladen.</div>
    <button class="btn btn-primary" onclick="exportProgress()">💾 Backup herunterladen</button>
  </div>
  <div class="card" style="width:480px;">
    <div class="section-title">Über C# Quest</div>
    <div class="body-text">Eine spielerische Lernplattform für C#-Einsteiger mit Arcade-Minispielen, Coin-Wirtschaft und Leaderboard. Läuft lokal über Node.js + MongoDB.</div>
  </div>`;
}

/* ---------- MASTER RENDER ---------- */
function render(){
  const app = document.getElementById("app");
  if (state.booting){ app.innerHTML = renderBoot(); return; }
  if (!state.currentUser){ app.innerHTML = renderAuth(); return; }
  let inner = "";
  switch(state.page){
    case "dashboard": inner = renderDashboard(); break;
    case "learning": inner = renderLearning(); break;
    case "exercises": inner = renderPractice(); break;
    case "achievements": inner = renderAchievements(); break;
    case "arcade": inner = renderArcade(); break;
    case "casino": inner = renderCasino(); break;
    case "shop": inner = renderShop(); break;
    case "friends": inner = renderFriends(); break;
    case "leaderboard": inner = renderLeaderboard(); break;
    case "profile": inner = renderProfile(); break;
    case "settings": inner = renderSettings(); break;
    case "admin": inner = (isAdminUser()||hasPermission("users.view")) ? renderAdmin() : renderDashboard(); break;
    default: inner = renderDashboard();
  }
  app.innerHTML = renderShell(inner);
  scheduleProgressSync(); // Fortschritt im Hintergrund mit dem Server abgleichen
}
