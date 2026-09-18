/* ---------- RENDER: AUTH ---------- */
function renderBoot(){
  return `<div class="auth-wrap"><div class="card auth-card" style="text-align:center;">
    <div style="font-size:40px;">${brandLogo(40)}</div>
    <div class="body-text">Lade...</div>
  </div></div>`;
}
function renderAuth(){
  const err = state.authError ? `<div class="error-text">${escapeHtml(state.authError)}</div>` : `<div class="error-text"></div>`;
  const busy = state.authBusy;
  const mode = state.authMode;
  const footer = `<div class="auth-footer">© ${new Date().getFullYear()} CodeBase · <button class="btn-ghost" onclick="setAuthMode('impressum')">Impressum</button> · <button class="btn-ghost" onclick="setAuthMode('datenschutz')">Datenschutz</button></div>`;
  if (mode==="impressum" || mode==="datenschutz") return renderLegalPage(mode) + footer;
  const tabs = `<div class="auth-tabs">
    <button class="auth-tab ${mode==='login'?'active':''}" onclick="setAuthMode('login')">${icon('key',16)} Login</button>
    <button class="auth-tab ${mode==='register'?'active':''}" onclick="setAuthMode('register')">${icon('userPlus',16)} Registrieren</button>
    <div class="auth-tab-slider" style="transform:translateX(${mode==='login'?'0':'100%'});"></div>
  </div>`;
  const logo = `<div class="auth-logo" style="font-size:40px;">🚀</div>`;

  if (mode==="login"){
    return `
    <div class="auth-wrap"><div><div class="card auth-card">
      ${tabs}
      ${logo}
      <div class="title" style="text-align:center;">Willkommen zurück!</div>
      <div class="body-text" style="margin-bottom:20px; text-align:center;">Melde dich an — dein Fortschritt lebt in der Datenbank.</div>
      <div class="field-label">Nutzername</div>
      <input id="loginUser" type="text" placeholder="dein Nutzername" autocomplete="username" style="width:100%;"/>
      <div class="field-label" style="margin-top:10px;">Passwort</div>
      <input id="loginPass" type="password" placeholder="dein Passwort" autocomplete="current-password" style="width:100%;"
        onkeydown="if(event.key==='Enter')doLogin(document.getElementById('loginUser').value, document.getElementById('loginPass').value)"/>
      ${err}
      <button class="btn btn-primary" style="width:100%; margin:14px 0;" ${busy?"disabled":""}
        onclick="doLogin(document.getElementById('loginUser').value, document.getElementById('loginPass').value)">${busy?"Anmelden...":"Anmelden"}</button>
      ${state.wasBannedUsername ? `
        <div class="card" style="text-align:left; margin-top:6px; background:rgba(255,69,58,0.1); border-color:rgba(255,69,58,0.3);">
          <div class="section-title" style="font-size:14px;">${icon('ban',16)} Konto gesperrt?</div>
          <div class="body-text" style="margin-bottom:10px;">Du kannst eine Entsperrung mit Begründung beantragen — ein Admin prüft das.</div>
          <textarea id="unbanReason" rows="2" placeholder="Warum sollte dein Konto entsperrt werden?" style="width:100%; margin-bottom:8px;"></textarea>
          <button class="btn btn-secondary" style="width:100%;" onclick="submitUnbanRequest('${escapeHtml(state.wasBannedUsername)}', document.getElementById('unbanReason').value)">Entsperrung beantragen</button>
        </div>` : ""}
    </div>${footer}</div></div>`;
  }
  return `
  <div class="auth-wrap"><div><div class="card auth-card">
    ${tabs}
    ${logo}
    <div class="title" style="text-align:center;">Konto erstellen</div>
    <div class="body-text" style="margin-bottom:20px; text-align:center;">Nutzername: 3-20 Zeichen (Buchstaben/Zahlen/_). Passwort: mind. 6 Zeichen.</div>
    <div class="field-label">Nutzername</div>
    <input id="regUser" type="text" placeholder="z.B. Max" autocomplete="username" style="width:100%;"/>
    <div class="field-label" style="margin-top:10px;">Passwort</div>
    <input id="regPass" type="password" placeholder="Passwort" autocomplete="new-password" style="width:100%;"/>
    <div class="field-label" style="margin-top:10px;">Passwort wiederholen</div>
    <input id="regPass2" type="password" placeholder="Passwort wiederholen" autocomplete="new-password" style="width:100%;"
      onkeydown="if(event.key==='Enter')doRegister(document.getElementById('regUser').value, document.getElementById('regPass').value, document.getElementById('regPass2').value)"/>
    ${err}
    <button class="btn btn-primary" style="width:100%; margin:14px 0;" ${busy?"disabled":""}
      onclick="doRegister(document.getElementById('regUser').value, document.getElementById('regPass').value, document.getElementById('regPass2').value)">${busy?"Erstelle Konto...":"Registrieren"}</button>
  </div>${footer}</div></div>`;
}
function legalContent(mode){
  const isImpressum = mode==="impressum";
  return isImpressum ? `
      <div class="warn-banner">⚠️ Platzhalter — der Betreiber dieser Website muss hier die echten Pflichtangaben nach § 5 DDG (ehem. TMG) einsetzen, bevor die Seite öffentlich genutzt wird.</div>
      <div class="body-text" style="margin-top:14px;"><b>Angaben gemäß § 5 DDG</b><br/>
      [Vor- und Nachname / Firmenname]<br/>[Straße und Hausnummer]<br/>[PLZ und Ort]</div>
      <div class="body-text" style="margin-top:14px;"><b>Kontakt</b><br/>E-Mail: [deine E-Mail-Adresse]</div>
      <div class="body-text" style="margin-top:14px;"><b>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</b><br/>[Name, Anschrift wie oben]</div>
    ` : `
      <div class="warn-banner">⚠️ Diese Vorlage ersetzt keine Rechtsberatung — für eine rechtssichere Datenschutzerklärung einen Generator oder Anwalt nutzen.</div>
      <div class="body-text" style="margin-top:14px;"><b>Welche Daten werden gespeichert?</b><br/>Nutzername, gehashtes Passwort (nie im Klartext), dein Lernfortschritt (Level/XP/Coins), freiwillig hochgeladene Profilbilder/Banner, sowie zu Sicherheitszwecken deine IP-Adresse bei Registrierung/Login (Schutz vor Konten-Missbrauch nach Sperren).</div>
      <div class="body-text" style="margin-top:14px;"><b>Warum?</b><br/>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — Bereitstellung des Kontos) sowie lit. f (berechtigtes Interesse an Missbrauchsschutz).</div>
      <div class="body-text" style="margin-top:14px;"><b>Deine Rechte</b><br/>Du kannst jederzeit Auskunft über deine gespeicherten Daten, deren Löschung oder Berichtigung verlangen. Kontakt: [deine E-Mail-Adresse]</div>
    `;
}
function renderLegalPage(mode){
  const isImpressum = mode==="impressum";
  return `<div class="auth-wrap"><div><div class="card auth-card" style="width:620px; text-align:left; max-height:80vh; overflow-y:auto;">
    <button class="btn-ghost" onclick="setAuthMode('login')">← Zurück zum Login</button>
    <div class="title" style="margin-top:12px;">${isImpressum?"Impressum":"Datenschutzerklärung"}</div>
    ${legalContent(mode)}
  </div></div></div>`;
}

/* ---------- RENDER: SHELL ---------- */
function renderShell(inner){
  const u = state.users[state.currentUser];
  const items = [
    ["dashboard", icon("home",18), "Dashboard"], ["learning", icon("book",18), "Lernen"], ["exercises", icon("target",18), "Aufgaben"],
    ["achievements", icon("trophy",18), "Erfolge"], ["games", icon("gamepad",18), "Spiele"],
    ["projects", icon("terminal",18), "Projekte"], ["handbuch", icon("bookmark",18), "Handbuch"],
    ["shop", icon("wallet",18), "Shop"], ["subscription", icon("card",18), "Abo"], ["friends", icon("users",18), "Freunde"],
    ["leaderboard", icon("medal",18), "Leaderboard"], ["profile", icon("user",18), "Profil"], ["settings", icon("settings",18), "Einstellungen"],
  ];
  if (isAdminUser() || hasPermission("users.view")) items.push(["admin", icon("shield",18), "Admin-Panel"]);
  const roleLabel = u.role==="admin" ? "Admin" : u.role==="moderator" ? "Moderator" : "Angemeldet";
  const gamePages = ["games","arcade","cookie","factory","casino"];
  const nav = items.map(([k,ic,label])=>`<button class="nav-item ${(state.page===k || (k==="games"&&gamePages.includes(state.page)))?'active':''}" onclick="goto('${k}')">${ic}<span>${label}</span></button>`).join("");
  return `
  <div class="shell">
    <div class="sidebar">
      <div class="brand"><h1>${brandLogo()} CodeBase</h1><p>Lerne. Spiele. Vernetze dich.</p></div>
      <div class="sidebar-nav">${nav}</div>
      <div class="sidebar-bottom">
        ${state.userMenuOpen ? `
        <div class="user-menu">
          <button class="user-menu-item" onclick="state.userMenuOpen=false; goto('profile')">${icon("user",16)} Profil</button>
          <button class="user-menu-item" onclick="state.userMenuOpen=false; goto('settings')">${icon("settings",16)} Einstellungen</button>
          <div class="user-menu-sep"></div>
          <button class="user-menu-item" onclick="toggleSound()">${state.soundOn?"🔊":"🔇"} Sound ${state.soundOn?"aus":"an"}</button>
          <button class="user-menu-item user-menu-danger" onclick="state.userMenuOpen=false; logout()">${icon("logout",16)} Abmelden</button>
        </div>` : ""}
        <button class="user-chip" onclick="state.userMenuOpen=!state.userMenuOpen; render();">
          <span class="av">${u.profilePicture?`<img src="${u.profilePicture}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`:u.avatar}</span>
          <div style="text-align:left;"><div style="font-weight:600; font-size:13px;">${escapeHtml(state.currentUser)}</div><div class="muted">${roleLabel}</div></div>
          <span style="margin-left:auto; color:var(--text-muted);">${icon("settings",16)}</span>
        </button>
      </div>
    </div>
    <div class="content">
      <div class="bg-deco" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <circle cx="88" cy="8" r="16" fill="none" stroke="var(--accent)" stroke-width="0.4"/>
          <circle cx="92" cy="14" r="26" fill="none" stroke="var(--accent-2)" stroke-width="0.25"/>
          <line x1="60" y1="0" x2="100" y2="30" stroke="var(--accent)" stroke-width="0.3"/>
          <line x1="70" y1="0" x2="100" y2="22" stroke="var(--ios-pink)" stroke-width="0.2"/>
          <circle cx="6" cy="92" r="20" fill="none" stroke="var(--gem)" stroke-width="0.3"/>
          <line x1="0" y1="70" x2="30" y2="100" stroke="var(--gem)" stroke-width="0.25"/>
          <circle cx="50" cy="50" r="1" fill="var(--accent)" opacity="0.4"/>
        </svg>
      </div>
      ${state.underReviewBy ? `<div class="review-banner">${icon("shield",18)} <b>Dein Account wird gerade von einem Admin geprüft.</b> Das ist eine normale Moderations-Maßnahme — mach einfach weiter wie gewohnt.</div>` : ""}
      ${u.warnings && u.warnings.length>0 ? `<div class="warn-banner" style="margin-bottom:16px;">⚠️ Du hast ${u.warnings.length} Verwarnung(en) erhalten. Letzter Grund: "${escapeHtml(u.warnings[u.warnings.length-1].reason)}". Bei weiteren Verstößen wird dein Konto automatisch gesperrt.</div>` : ""}
      ${inner}
    </div>
  </div>`;
}

/* ---------- RENDER: PFLICHT-ONBOARDING NACH REGISTRIERUNG ---------- */
function renderOnboarding(){
  const u = state.users[state.currentUser];
  const avatars = AVATARS.map(a=>`<button class="btn btn-secondary avatar-pick ${u.avatar===a?'avatar-selected':''}" onclick="const usr=state.users[state.currentUser]; usr.avatar='${a}'; render();">${a}</button>`).join("");
  const templates = BANNER_TEMPLATES.map(t=>`<button class="banner-tpl ${u.bannerImage===t.id?'selected':''}" style="background:${t.css};" onclick="pickBannerTemplate('${t.id}')" title="${t.label}"></button>`).join("");
  const courseBadges = COURSES.map(c=>`<button class="course-badge ${u.favoriteCourse===c.id?'selected':''}" style="--badge-color:${c.color};" onclick="pickFavoriteCourse('${c.id}')">${c.icon} ${escapeHtml(c.title)}</button>`).join("");
  const bioLen = (u.bio||"").length;

  return `
  <div class="onboarding-wrap">
    <div class="card" style="width:600px; max-width:92vw; padding:0; overflow:hidden;">

      <!-- LIVE-VORSCHAU: so sehen dich andere -->
      <div class="profile-preview">
        <div class="pp-banner" style="background:${bannerCssFor(u)};"></div>
        <div class="pp-body">
          <div class="pp-avatar">${u.profilePicture?`<img src="${u.profilePicture}">`:`<span>${u.avatar}</span>`}</div>
          <div class="pp-info">
            <div class="pp-name">${escapeHtml(state.currentUser)} ${u.favoriteCourse?`<span class="course-chip" style="--badge-color:${(COURSES.find(c=>c.id===u.favoriteCourse)||{}).color||'var(--accent)'};">${(COURSES.find(c=>c.id===u.favoriteCourse)||{}).icon||''} ${escapeHtml((COURSES.find(c=>c.id===u.favoriteCourse)||{}).title||'')}</span>`:''}</div>
            <div class="pp-bio">${escapeHtml(u.bio||"Noch keine Bio...")}</div>
          </div>
        </div>
      </div>

      <div style="padding:24px;">
        <div class="title" style="text-align:center;">${brandLogo(30)} Profil einrichten</div>
        <div class="body-text" style="text-align:center; margin-bottom:22px;">Bevor's losgeht: richte dein Profil ein — die Vorschau oben zeigt live, wie es aussieht.</div>

        <div class="field-label">Banner</div>
        <div class="banner-drop" ondragover="event.preventDefault();" ondrop="handleDropImage(event,'banner')">
          <label class="file-upload">
            <span class="file-btn">${icon("upload",16)} Banner hochladen oder hierher ziehen</span>
            <input type="file" accept="image/*" onchange="readAndUploadImage(this.files[0],'banner')"/>
          </label>
        </div>
        <div style="display:flex; gap:8px; margin:10px 0 6px; flex-wrap:wrap;">${templates}</div>
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:18px;">
          <span class="muted">Oder eigene Farbe:</span>
          <input type="color" value="${u.bannerColor||'#ff7a1a'}" oninput="pickBannerColor(this.value)" style="width:44px; height:32px; padding:2px;"/>
        </div>

        <div class="field-label">Profilbild</div>
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:10px;">
          <div class="pfp-drop" ondragover="event.preventDefault();" ondrop="handleDropImage(event,'picture')">
            ${u.profilePicture ? `<img src="${u.profilePicture}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : icon("image",26)}
          </div>
          <label class="file-upload">
            <span class="file-btn">${icon("upload",16)} Bild hochladen oder ziehen</span>
            <input type="file" accept="image/*" onchange="readAndUploadImage(this.files[0],'picture')"/>
          </label>
        </div>
        <div class="muted" style="margin-bottom:6px;">...oder Emoji-Avatar:</div>
        <div style="margin-bottom:18px;">${avatars}</div>

        <div class="field-label">Lieblingssprache <span class="muted">(optional, als Badge auf deinem Profil)</span></div>
        <div style="display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap;">${courseBadges}</div>

        <div class="field-label" style="display:flex; justify-content:space-between;"><span>Kurze Bio</span><span class="muted" id="bioCounter">${bioLen}/160</span></div>
        <textarea id="onbBio" rows="2" maxlength="160" placeholder="Erzähl kurz was über dich..." style="width:100%; margin-bottom:20px;"
          oninput="document.getElementById('bioCounter').textContent=this.value.length+'/160'; state.users[state.currentUser].bio=this.value; document.querySelector('.pp-bio').textContent=this.value||'Noch keine Bio...';">${escapeHtml(u.bio||"")}</textarea>

        <button class="btn btn-primary" style="width:100%;" onclick="saveOnboarding()">Profil speichern & loslegen ${icon("arrowRight",16)}</button>
      </div>
    </div>
  </div>`;
}

/* ---------- RENDER: TUTORIAL (Discord-artige Einführungs-Tour) ---------- */
const TUTORIAL_STEPS = [
  { anchor:"top", title:"Willkommen bei CodeBase! 👋", text:"Kurze Tour, dann kann's losgehen. Klick auf Weiter." },
  { anchor:"nav-learning", title:"Lernen", text:"Hier findest du alle Kurse — aktuell C# und Python, Level für Level aufgebaut." },
  { anchor:"nav-games", title:"Spiele", text:"Arcade, Cookie Clicker, Factory und Casino — alles an einem Ort, mit deinen Coins spielbar." },
  { anchor:"nav-friends", title:"Freunde", text:"Andere Nutzer suchen, Freundschaften schließen und schreiben." },
  { anchor:"nav-profile", title:"Profil", text:"Dein Profilbild, Banner und deine Bio kannst du hier jederzeit wieder ändern." },
  { anchor:"top", title:"Los geht's! 🚀", text:"Das war's schon. Viel Spaß beim Lernen und Spielen!" },
];
function renderTutorial(){
  if (!state.showTutorial) return "";
  const step = TUTORIAL_STEPS[state.tutorialStep];
  const posClass = "tt-pos-"+step.anchor.replace("nav-","nav-");
  const isLast = state.tutorialStep >= TUTORIAL_STEPS.length-1;
  return `
  <div class="tutorial-overlay">
    <div class="tutorial-bubble ${posClass}">
      <div class="tt-arrow"></div>
      <div class="section-title" style="margin-bottom:6px;">${escapeHtml(step.title)}</div>
      <div class="body-text" style="margin-bottom:14px;">${escapeHtml(step.text)}</div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="muted">${state.tutorialStep+1}/${TUTORIAL_STEPS.length}</span>
        <button class="btn btn-primary" onclick="nextTutorialStep()">${isLast?"Los geht's":"Weiter"} ${icon("arrowRight",14)}</button>
      </div>
    </div>
  </div>`;
}

/* ---------- RENDER: KURS-SWITCHER ---------- */
function renderCourseSwitcher(){
  return `<div class="segmented">${COURSES.map(c=>
    `<button class="${state.course===c.id?'active':''}" onclick="switchCourse('${c.id}')">${c.icon} ${escapeHtml(c.title)}</button>`
  ).join("")}</div>`;
}

/* ---------- RENDER: DASHBOARD ---------- */
function renderDashboard(){
  const p = progress();
  const u = state.users[state.currentUser];
  const need = xpForLevel(p.level);
  const pct = Math.min(100, Math.round(100*p.xp/need));
  const courseLessons = lessonsForCourse(state.course);
  const completed = courseLessons.filter(l=>p.completedLessons.includes(l.id)).length, total = courseLessons.length;
  const coursePct = total ? Math.round(100*completed/total) : 0;
  const nextLesson = courseLessons.find(l=>lessonUnlocked(l,p) && !p.completedLessons.includes(l.id));
  const courseMeta = COURSES.find(c=>c.id===state.course) || COURSES[0];
  const recentAch = ACHIEVEMENTS.filter(a=>p.unlocked.includes(a.id)).slice(-3).reverse();
  return `
  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:14px;">
    <div style="display:flex; align-items:center;">
      <div class="gradient-bg" style="border-radius:30px; width:60px; height:60px; display:flex; align-items:center; justify-content:center; font-size:30px;">${u.profilePicture?`<img src="${u.profilePicture}" style="width:100%;height:100%;border-radius:30px;object-fit:cover;">`:u.avatar}</div>
      <div style="margin-left:16px;">
        <div class="title">Willkommen zurück, ${escapeHtml(state.currentUser)}! 👋</div>
        <div class="body-text">Lerne ${escapeHtml(courseMeta.title)} spielerisch und werde jeden Tag besser.</div>
      </div>
    </div>
    ${renderCourseSwitcher()}
  </div>
  <div class="stat-grid">
    <div class="card"><div class="muted">⭐ LEVEL</div><div style="font-size:28px; font-weight:700;">${p.level}</div>
      <div class="progressbar-track" style="margin-top:8px;"><div class="progressbar-fill" style="width:${pct}%;"></div></div>
      <div class="muted" style="margin-top:4px;">${p.xp} / ${need} XP</div></div>
    <div class="card"><div class="muted">🪙 COINS</div><div style="font-size:28px; font-weight:700; color:var(--coin);">${p.coins}</div>
      <div class="muted" style="margin-top:20px;">Für die Arcade ausgeben</div></div>
    <div class="card"><div class="muted">💎 GEMS</div><div style="font-size:28px; font-weight:700; color:var(--gem);">${p.gems}</div>
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
      <button class="btn" style="background:white; color:var(--ios-indigo);" onclick="goto('learning')">Weiterlernen ▶</button>
    </div>
    <div class="card">
      <div class="muted">🎯 TAGESZIEL</div>
      <div class="body-text" style="margin:8px 0 12px;">${p.daily.exToday}/3 Aufgaben · ${p.daily.xpToday}/15 XP heute</div>
      ${(p.daily.exToday>=3||p.daily.xpToday>=15||p.daily.lessonsToday>=1) && !p.daily.claimed ?
        `<button class="btn btn-primary" onclick="claimDaily()">+10 Coins abholen</button>` : ""}
    </div>
  </div>

  <div class="section-title" style="margin-top:22px;">Deine Kurse</div>
  <div class="ach-grid" style="margin-bottom:22px;">
    ${COURSES.map(c=>{
      const ls = lessonsForCourse(c.id);
      const done = ls.filter(l=>p.completedLessons.includes(l.id)).length;
      const pctC = ls.length ? Math.round(100*done/ls.length) : 0;
      return `<div class="card" style="cursor:pointer;" onclick="switchCourse('${c.id}'); goto('learning');">
        <div style="display:flex; align-items:center; gap:8px;"><span style="font-size:20px;">${c.icon}</span><b>${escapeHtml(c.title)}</b></div>
        <div class="progressbar-track" style="margin-top:10px;"><div class="progressbar-fill" style="width:${pctC}%; background:${c.color};"></div></div>
        <div class="muted" style="margin-top:6px;">${done}/${ls.length} Lektionen</div>
      </div>`;
    }).join("")}
  </div>

  <div class="two-col">
    <div class="card">
      <div class="section-title" style="display:flex; justify-content:space-between; align-items:center;">
        Zuletzt freigeschaltet <button class="btn-ghost" onclick="goto('achievements')">Alle ansehen</button>
      </div>
      ${recentAch.length ? recentAch.map(a=>`<div style="display:flex; align-items:center; gap:10px; padding:6px 0;">
        <span style="font-size:22px;">${a.icon}</span><div><b>${escapeHtml(a.title)}</b><div class="muted">${escapeHtml(a.desc)}</div></div>
      </div>`).join("") : `<div class="body-text muted">Noch keine Erfolge — leg los!</div>`}
    </div>
    <div class="card">
      <div class="section-title" style="display:flex; justify-content:space-between; align-items:center;">
        Top 3 <button class="btn-ghost" onclick="goto('leaderboard')">Leaderboard</button>
      </div>
      ${state.dashboardTop3===null ? `<div class="body-text muted">Lade...</div>` :
        state.dashboardTop3.map((r,i)=>`<div style="display:flex; align-items:center; gap:10px; padding:6px 0;">
          <span>${i===0?"🥇":i===1?"🥈":"🥉"}</span><span style="font-size:18px;">${r.avatar}</span>
          <b style="flex:1;">${escapeHtml(r.username)}</b><span class="muted">${r.score} XP</span>
        </div>`).join("")}
      ${state.friendsData ? `<div class="muted" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
        ${icon("users",13)} ${state.friendsData.friends.length} Freunde ${state.friendsData.incoming.length ? `· <span style="color:var(--accent);">${state.friendsData.incoming.length} neue Anfrage(n)</span>`:""}
      </div>` : ""}
    </div>
  </div>

  <div class="section-title" style="margin-top:22px;">Schnellzugriff</div>
  <div class="quick-grid">
    <button class="btn btn-secondary" style="padding:16px 20px;" onclick="goto('learning')">${icon("book",16)} Lernen</button>
    <button class="btn btn-secondary" style="padding:16px 20px;" onclick="goto('exercises')">${icon("target",16)} Aufgaben</button>
    <button class="btn btn-secondary" style="padding:16px 20px;" onclick="goto('games')">${icon("gamepad",16)} Spiele</button>
    <button class="btn btn-secondary" style="padding:16px 20px;" onclick="goto('leaderboard')">${icon("medal",16)} Leaderboard</button>
  </div>
  <div class="warn-banner" style="margin-top:24px;">✅ Dein Fortschritt wird automatisch in der Datenbank gespeichert — du kannst dich von jedem Gerät aus wieder einloggen.</div>
  `;
}
function claimDaily(){
  const p=progress();
  // Sicherheitsfix: Guard gegen Mehrfachaufruf (z.B. über die Browser-Konsole).
  if (p.daily.claimed) return;
  const unlocked = p.daily.exToday>=3 || p.daily.xpToday>=15 || p.daily.lessonsToday>=1;
  if (!unlocked) return;
  p.daily.claimed=true; addCoins(p,10); playSound("coin"); render();
}

/* ---------- RENDER: LEARNING ---------- */
function renderLearning(){
  if (state.lessonId) return renderLessonDetail();
  const p = progress();
  const courseMeta = COURSES.find(c=>c.id===state.course) || COURSES[0];
  const groups = {};
  lessonsForCourse(state.course).forEach(l=>{ (groups[l.grp] ||= []).push(l); });
  let html = `<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; margin-bottom:6px;">
    <div class="title">${courseMeta.icon} ${escapeHtml(courseMeta.title)} lernen</div>
    ${renderCourseSwitcher()}
  </div><div class="body-text" style="margin-bottom:20px;">Arbeite dich Level für Level durch den Kurs.</div>`;
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
        <div class="top-row"><span class="icon">${l.icon}</span><span class="${done_?'status-done':unlocked?'':'status-locked'}">${done_?icon("check",16):(unlocked?"":icon("lock",15))}</span></div>
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
    <div class="card" style="background:rgba(94,92,230,0.16);"><div style="font-weight:700; color:var(--xp); margin-bottom:8px;">🧠 Merke</div><div class="body-text">${escapeHtml(l.remember)}</div></div>
    <div class="card" style="background:rgba(255,159,10,0.14);"><div style="font-weight:700; color:var(--warning); margin-bottom:8px;">⚡ Profi-Tipp</div><div class="body-text">${escapeHtml(l.tip)}</div></div>
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
  if (state.examSession) return renderExam();
  let xpGained=0, coinsGained=0;
  state.practiceInstances.forEach(i=>{ if(i.correct){ xpGained+=EXERCISES[i.exId].xp; coinsGained+=EXERCISES[i.exId].coins; }});
  let html = `<div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px;">
    <div class="title">🎯 Aufgaben</div>${renderCourseSwitcher()}
  </div>
  <div class="body-text" style="margin-bottom:12px;">Freies Training: zufällige Aufgaben aus dem gewählten Kurs für Extra-XP und Coins.</div>
  <div class="card" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
    <div style="display:flex; gap:24px;">
      <div><div class="muted">XP DIESE RUNDE</div><div style="font-size:20px; font-weight:700; color:var(--xp);">${xpGained}</div></div>
      <div><div class="muted">COINS DIESE RUNDE</div><div style="font-size:20px; font-weight:700; color:var(--coin);">${coinsGained}</div></div>
    </div>
    <div style="display:flex; gap:10px;">
      <button class="btn btn-secondary" onclick="loadPractice(); render();">🔀 Neue Aufgaben</button>
      <button class="btn btn-primary" onclick="startExam()">${icon("edit",16)} Klausur starten (10 Fragen)</button>
    </div>
  </div>`;
  state.practiceInstances.forEach((inst,idx)=>{ html += renderExerciseWidget(inst, idx, "practice"); });
  return html;
}
function renderExam(){
  const ex = state.examSession;
  if (ex.finished){
    const r = ex.result;
    return `<div class="title">📝 Klausur-Ergebnis</div>
    <div class="card gradient-bg casino-result-pop" style="text-align:center; margin:16px 0;">
      <div style="font-size:40px; font-weight:800; color:white;">Note ${r.grade}</div>
      <div style="color:#ede9ff; margin:6px 0;">${r.correctCount}/${r.total} richtig (${r.pct}%) — ${r.passed?"Bestanden ✓":"Nicht bestanden"}</div>
      <div style="color:#ede9ff;">+${r.coinsEarned} Coins</div>
    </div>
    ${r.unlocked.length ? `<div class="body-text" style="margin-bottom:14px;">🏆 Neuer Erfolg: ${r.unlocked.map(a=>escapeHtml(a.title)).join(", ")}</div>` : ""}
    <button class="btn btn-primary" onclick="exitExam()">Zurück zu den Aufgaben</button>`;
  }
  const inst = ex.instances[ex.index];
  return `<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
    <div class="title" style="margin:0;">📝 Klausur — Frage ${ex.index+1}/${ex.instances.length}</div>
    <button class="btn btn-secondary" onclick="exitExam()">Abbrechen</button>
  </div>
  <div class="progressbar-track" style="margin-bottom:18px;"><div class="progressbar-fill" style="width:${100*(ex.index)/ex.instances.length}%;"></div></div>
  ${renderExerciseWidget(inst, ex.index, "exam")}
  ${inst.answered ? `<button class="btn btn-primary" style="margin-top:10px;" onclick="examNext()">${ex.index<ex.instances.length-1?"Nächste Frage":"Klausur abschließen"} ${icon("arrowRight",16)}</button>` : ""}`;
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
  {key:"bubble", icon:"🫧", title:"Bubble Shooter", desc:"Poppe verbundene Kugeln gleicher Farbe und sammle Combo-Punkte.", high:p=>p.bubbleHigh, start:"startBubble", unlockLevel:1,
    tips:["Klicke auf eine Kugel, um sie und alle direkt verbundenen gleichfarbigen Nachbarn zu poppen.","Mindestens 2 gleichfarbige Kugeln müssen zusammenhängen.","Größere Gruppen und Combos (mehrfach hintereinander poppen) bringen mehr Punkte.","Räumst du das ganze Feld leer, geht's im nächsten Level mit mehr Farben weiter."]},
  {key:"tap", icon:"⚡", title:"TapTap Arrow", desc:"Reagiere blitzschnell auf die richtige Pfeilrichtung.", high:p=>p.tapHigh, start:"startTap", unlockLevel:2,
    tips:["Drück die angezeigte Pfeilrichtung, bevor die Zeit abläuft — per Klick oder Tastatur-Pfeiltasten.","Jede richtige Antwort erhöht deine Combo und das Tempo.","3 Leben — bei falscher Richtung oder Zeitüberschreitung verlierst du eins."]},
  {key:"memory", icon:"🧠", title:"Memory Match", desc:"Finde Paare aus C#-Begriff und passender Erklärung.", high:p=>p.memoryHigh, start:"startMemory", unlockLevel:3,
    tips:["Decke zwei Karten auf — passen Begriff und Erklärung zusammen, bleiben sie offen.","Merk dir, was wo lag, um mit möglichst wenigen Versuchen fertig zu werden.","Schaffst du es fehlerfrei, gibt's einen extra Erfolg."]},
  {key:"quizrush", icon:"🚀", title:"Quiz Rush", desc:"Beantworte C#-Fragen im Rennen gegen die Uhr, 3 Leben.", high:p=>p.quizRushHigh, start:"startQuizRush", unlockLevel:4,
    tips:["Beantworte Multiple-Choice-Fragen, bevor die Zeit abläuft.","Je länger deine Serie, desto weniger Zeit bleibt — aber desto mehr Punkte pro Antwort.","3 Leben — bei falscher Antwort oder Zeitüberschreitung verlierst du eins."]},
  {key:"pacman", icon:"👾", title:"Pac-Man", desc:"Sammle alle Punkte im Labyrinth, weiche den Geistern aus. Power-Pellets machen sie fressbar!", high:p=>p.pacmanHigh, start:"startPacman", unlockLevel:1,
    tips:["Steuerung: Pfeiltasten, WASD oder die Buttons unterm Spielfeld.","Sammle alle kleinen Punkte, um das Level zu gewinnen.","Die großen, blinkenden Power-Pellets machen Geister für kurze Zeit fressbar — dann bringen sie Bonuspunkte statt ein Leben zu kosten.","3 Leben, an den Seitenrändern gibt's einen Tunnel-Durchgang."]},
  {key:"snake", icon:"🟢", title:"Snake", desc:"Klassiker: Frisst du Punkte, wird die Schlange länger — beiß dir nicht selbst in den Schwanz!", high:p=>p.snakeHigh||0, start:"startSnake", unlockLevel:1,
    tips:["Steuerung: Pfeiltasten oder WASD, die Schlange bewegt sich automatisch weiter.","Iss die roten Punkte, um zu wachsen und Punkte zu sammeln.","Berührst du dich selbst oder eine Wand, ist die Runde vorbei.","Wird mit steigender Länge schneller!"]},
];
function renderArcade(){
  if (state.arcadeGame==="bubble") return renderBubbleGame();
  if (state.arcadeGame==="tap") return renderTapGame();
  if (state.arcadeGame==="memory") return renderMemoryGame();
  if (state.arcadeGame==="quizrush") return renderQuizRushGame();
  if (state.arcadeGame==="pacman") return renderPacmanGame();
  if (state.arcadeGame==="snake") return renderSnakeGame();
  const p = progress();
  let html = `
  <div class="section-title">Arcade-Minispiele</div>
  <div class="body-text">Alle Minispiele sind komplett kostenlos. Es gibt keine Coins — nur XP fürs Spielen und je nach Score. Weitere Spiele schalten sich mit steigendem Level frei.</div>
  <div class="game-grid" style="margin-top:16px;">`;
  ARCADE_GAMES.forEach(g=>{
    const levelLocked = p.level < g.unlockLevel;
    html += `<div class="card game-card ${levelLocked?'game-card-locked':''}">
      <div class="gicon" style="${levelLocked?'opacity:.35; filter:grayscale(1);':''}">${levelLocked?icon("lock",34):g.icon}</div>
      <div class="section-title" style="margin:10px 0 4px;">${escapeHtml(g.title)}</div>
      <div class="body-text">${escapeHtml(g.desc)}</div>
      <div class="muted" style="margin:10px 0 14px;">${levelLocked?`${icon("lock",12)} Ab Level ${g.unlockLevel}`:`${icon("trophy",12)} Highscore: ${g.high(p)}`}</div>
      <button class="btn btn-primary" ${levelLocked?"disabled":""} onclick="${levelLocked?"":`showGameTips('${g.key}')`}">${levelLocked?"Gesperrt":"Spielen"}</button>
    </div>`;
  });
  return html+`</div>`;
}
async function showGameTips(gameKey){
  const g = ARCADE_GAMES.find(x=>x.key===gameKey);
  if (!g){ return; }
  if (localStorage.getItem("cb_tips_seen_"+gameKey)){ window[g.start](); return; }
  const msg = g.tips.map((t,i)=>`${i+1}. ${t}`).join("\n");
  await customAlert(msg, `${g.icon} ${g.title} — so geht's`);
  localStorage.setItem("cb_tips_seen_"+gameKey, "1");
  window[g.start]();
}

/* ---------- RENDER: LEADERBOARD ---------- */
const LEADERBOARD_TABS = [
  {key:"xp", label:"⭐ XP"}, {key:"coins", label:"🪙 Coins"}, {key:"gems", label:"💎 Gems"},
  {key:"streak", label:"🔥 Streak"}, {key:"bubble", label:"🫧 Bubble"}, {key:"tap", label:"⚡ TapTap"},
  {key:"memory", label:"🧠 Memory"}, {key:"quizrush", label:"🚀 QuizRush"}, {key:"pacman", label:"👾 Pac-Man"},
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
    <span>💎 Gems: <b style="color:var(--gem);">${p.gems}</b></span>
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
/* ---------- CASINO: SPIELKARTE (SVG statt Emoji) ---------- */
function playingCardHtml(label, hidden){
  if (hidden){
    return `<div class="playing-card back"></div>`;
  }
  const suits = ["♠","♥","♦","♣"];
  const suit = suits[Math.abs((label||"?").charCodeAt(0)) % suits.length];
  const red = suit==="♥"||suit==="♦";
  return `<div class="playing-card">
    <div class="pc-rank" style="color:${red?'#e0303f':'#1c1c1e'};">${label}</div>
    <svg width="22" height="22" viewBox="0 0 24 24" style="fill:${red?'#e0303f':'#1c1c1e'};">
      ${suit==="♠" ? '<path d="M12 2c-3 4-8 6-8 11a5 5 0 0 0 8 3.9V21H9v1h6v-1h-3v-4.1A5 5 0 0 0 20 13c0-5-5-7-8-11Z"/>' :
        suit==="♥" ? '<path d="M12 21s-8-5.3-8-11.5A5 5 0 0 1 12 6a5 5 0 0 1 8 3.5C20 15.7 12 21 12 21Z"/>' :
        suit==="♦" ? '<path d="M12 2 20 12 12 22 4 12Z"/>' :
        '<circle cx="9" cy="9" r="4"/><circle cx="15" cy="9" r="4"/><circle cx="12" cy="15" r="4"/><rect x="11" y="17" width="2" height="4"/>' }
    </svg>
  </div>`;
}

/* ---------- CASINO: ICONS (SVG statt Emoji) ---------- */
function casinoIcon(id, size){
  size = size||36;
  const icons = {
    cherry: `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M9 13c0-6 4-9 6-10" stroke="#3a7d34" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="8" cy="17.5" r="4" fill="#e0303f"/><circle cx="15" cy="17.5" r="4" fill="#e0303f"/></svg>`,
    lemon: `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="6.5" fill="#ffd60a"/><path d="M3 12c3-2 6-2.5 9-2.5s6 .5 9 2.5" stroke="#e0b800" stroke-width="1" fill="none"/></svg>`,
    bell: `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 2a1 1 0 0 1 1 1v1.1A7 7 0 0 1 19 11v4l2.2 3.2H2.8L5 15v-4a7 7 0 0 1 6-6.9V3a1 1 0 0 1 1-1Z" fill="#ff9f0a"/><circle cx="12" cy="21" r="1.7" fill="#ff9f0a"/></svg>`,
    star: `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 2l2.9 6.3L22 9.3l-5 4.9 1.2 7-6.2-3.4L5.8 21.2 7 14.2 2 9.3l7.1-1z" fill="#64d2ff"/></svg>`,
    diamond: `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M4 9 L12 2 L20 9 L12 22 Z" fill="#5e5ce6"/><path d="M4 9 L20 9 L12 22 Z" fill="#8280f0" opacity="0.6"/></svg>`,
    heads: `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#7a5c00" stroke-width="1.3"/><path d="M12 5l2.4 5.1L20 11l-4.4 4 1.1 6-4.7-2.8-4.7 2.8 1.1-6L4 11l5.6-.9z" fill="#7a5c00"/></svg>`,
    tails: `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#7a5c00" stroke-width="1.3"/><path d="M12 4a8 8 0 1 0 0.01 0Z" fill="none" stroke="#7a5c00" stroke-width="1.2"/><circle cx="12" cy="12" r="3.4" fill="#7a5c00"/></svg>`,
  };
  return icons[id]||"";
}

function renderPacmanGame(){
  const g = state.pacman;
  if (!g) return `<div class="body-text">Lade...</div>`;
  const cellPx = 42;
  let cells = "";
  g.grid.forEach((row,y)=>{
    row.forEach((ch,x)=>{
      const isPlayer = g.player.x===x && g.player.y===y;
      const ghost = g.ghosts.find(gh=>gh.x===x && gh.y===y);
      let content = "";
      let cls = "pm-cell";
      if (ch==="#") cls += " pm-wall";
      if (isPlayer){
        cls += " pm-player pm-" + g.player.dir.toLowerCase();
      } else if (ghost){
        content = `<div class="pm-ghost ${g.frightened>0?'pm-frightened':''}" style="--ghost-color:${ghost.color};"></div>`;
      } else if (ch==="."){
        content = `<div class="pm-dot"></div>`;
      } else if (ch==="o"){
        content = `<div class="pm-pellet"></div>`;
      }
      cells += `<div class="${cls}">${content}</div>`;
    });
  });
  return `
  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; flex-wrap:wrap; gap:10px;">
    <div style="display:flex; gap:20px;">
      <div><span class="muted">SCORE</span> <b style="color:var(--coin);">${g.score}</b></div>
      <div><span class="muted">LEBEN</span> <b>${"●".repeat(g.lives)}${"○".repeat(3-g.lives)}</b></div>
      <div><span class="muted">PUNKTE ÜBRIG</span> <b>${g.dotsLeft}</b></div>
    </div>
    <button class="btn btn-secondary" onclick="exitPacman()">Beenden</button>
  </div>
  <div class="pm-grid" style="grid-template-columns:repeat(${PACMAN_MAP[0].length}, ${cellPx}px);" tabindex="0">${cells}</div>
  <div class="muted" style="margin-top:10px;">Steuerung: Pfeiltasten oder WASD</div>
  <div class="arrow-pad" style="margin-top:10px;">
    <div></div><button onclick="state.pacman.player.nextDir='Up'">${icon("arrowRight",18)}</button><div></div>
    <button onclick="state.pacman.player.nextDir='Left'" style="transform:rotate(180deg);">${icon("arrowRight",18)}</button>
    <div></div>
    <button onclick="state.pacman.player.nextDir='Right'">${icon("arrowRight",18)}</button>
    <div></div><button onclick="state.pacman.player.nextDir='Down'" style="transform:rotate(90deg);">${icon("arrowRight",18)}</button><div></div>
  </div>
  ${g.over ? `<div class="card gradient-bg casino-result-pop" style="margin-top:16px; text-align:center;">
    <div style="color:white; font-weight:700; font-size:18px;">${g.won?"🎉 Labyrinth geschafft!":"💀 Game Over"}</div>
    <div style="color:#ede9ff; margin:6px 0;">Score: ${g.score} · +${g.xpEarned} XP</div>
    <button class="btn" style="background:white; color:var(--accent); margin-top:8px;" onclick="exitPacman()">Zurück zur Übersicht</button>
  </div>` : ""}`;
}

/* ---------- RENDER: CASINO ---------- */
function renderCasino(){
  const p = progress();
  const r = state.casinoResult;
  const busy = state.casinoBusy;

  // Münze: rotiert während busy per CSS-Endlosanimation, zeigt danach die
  // tatsächliche Seite (Server-Ergebnis) mit einem kleinen "Settle"-Bounce.
  const coinShowsTails = r && r.game==="coinflip" && r.result==="tails";
  const coinHtml = `
  <div class="coin3d-wrap ${busy?'spinning':''}">
    <div class="coin3d ${!busy && r && r.game==='coinflip' ? 'settled':''}" style="${!busy && r && r.game==='coinflip' ? `transform:rotateY(${coinShowsTails?180:0}deg);`:''}">
      <div class="coin-face coin-front">${casinoIcon('heads',44)}</div>
      <div class="coin-face coin-back">${casinoIcon('tails',44)}</div>
    </div>
  </div>`;
  const coinResultText = (r && r.game==="coinflip")
    ? `<div style="text-align:center; font-weight:700; margin-top:10px; color:${r.win?'var(--success)':'var(--danger)'};">${r.result==='heads'?'Kopf':'Zahl'} — ${r.win?`Gewonnen! +${r.payout} 🪙`:'Verloren'}</div>`
    : "";

  // Slots: während busy zeigen die Walzen schnell wechselnde Zufallssymbole
  // (echtes "Spinnen"), danach das serverseitige Endergebnis.
  const spinIds = ["cherry","lemon","bell","star","diamond"];
  const reelSymbols = busy
    ? (state.casinoSpinFrame || [spinIds[0],spinIds[1],spinIds[2]])
    : (r && r.game==="slots" ? r.reels : ["cherry","lemon","bell"]);
  const slotsHtml = `
  <div class="slot-machine">
    <div class="slot-window">
      ${reelSymbols.map(sym=>`<div class="slot-reel ${busy?'spin-blur':'pop-in'}">${casinoIcon(sym,38)}</div>`).join("")}
    </div>
    <div class="slot-lever-track"><div class="slot-lever ${busy?'pulled':''}" onclick="pullSlotLever()"><div class="slot-lever-knob"></div></div></div>
  </div>`;
  const slotsResultText = (r && r.game==="slots")
    ? `<div style="text-align:center; font-weight:700; margin-top:10px; color:${r.payout>0?'var(--success)':'var(--danger)'};">${r.payout>0?`Gewonnen! +${r.payout} 🪙`:'Verloren'}</div>`
    : "";

  return `
  <div class="section-title">Casino</div>
  <div class="body-text" style="margin-bottom:6px;">Nur virtuelle Coins, kein Echtgeld — Ergebnisse werden serverseitig gewürfelt, nicht manipulierbar.</div>
  <div style="margin:6px 0 20px;">🪙 Dein Guthaben: <b style="color:var(--coin);">${p.coins}</b></div>
  <div class="game-grid">
    <div class="card" style="text-align:center;">
      <div class="section-title">Coinflip</div>
      <div class="body-text" style="margin-bottom:14px;">Kopf oder Zahl — bei Treffer verdoppelter Einsatz.</div>
      ${coinHtml}${coinResultText}
      <input id="cfBet" type="number" value="20" min="5" max="500" style="width:100px; margin:14px 0 10px;"/>
      <div style="display:flex; gap:10px; justify-content:center;">
        <button class="btn btn-primary" ${busy?"disabled":""} onclick="playCasinoCoinflip(document.getElementById('cfBet').value,'heads')">${casinoIcon('heads',16)} Kopf</button>
        <button class="btn btn-primary" ${busy?"disabled":""} onclick="playCasinoCoinflip(document.getElementById('cfBet').value,'tails')">${casinoIcon('tails',16)} Zahl</button>
      </div>
    </div>
    <div class="card" style="text-align:center;">
      <div class="section-title">Slots</div>
      <div class="body-text" style="margin-bottom:14px;">3 gleiche = großer Gewinn, 2 gleiche = kleiner Trostgewinn. Am Hebel ziehen!</div>
      ${slotsHtml}${slotsResultText}
      <input id="slBet" type="number" value="20" min="5" max="500" style="width:100px; margin:14px 0 10px;"/>
      <div><button class="btn btn-primary" ${busy?"disabled":""} onclick="pullSlotLever()">Hebel ziehen</button></div>
    </div>
    ${renderHigherLowerCard(busy)}
  </div>`;
}
function renderHigherLowerCard(busy){
  const r = state.casinoResult;
  const hl = r && r.game==="higherlower" ? r : null;
  return `
    <div class="card" style="text-align:center;">
      <div class="section-title">Higher / Lower</div>
      <div class="body-text" style="margin-bottom:14px;">Ist die zweite Karte höher oder niedriger als die erste?</div>
      <div style="display:flex; gap:10px; justify-content:center; margin-bottom:12px;">
        ${playingCardHtml(hl?hl.card1Label:"?", !hl)}
        ${playingCardHtml(hl?hl.card2Label:"?", !hl)}
      </div>
      ${hl ? `<div style="font-weight:700; margin-bottom:10px; color:${hl.win?'var(--success)':'var(--danger)'};">${hl.win?`Richtig! +${hl.payout} 🪙`:'Falsch getippt'}</div>` : ""}
      <input id="hlBet" type="number" value="20" min="5" max="500" style="width:100px; margin-bottom:10px;"/>
      <div style="display:flex; gap:10px; justify-content:center;">
        <button class="btn btn-primary" ${busy?"disabled":""} onclick="playHigherLower('higher')">▲ Höher</button>
        <button class="btn btn-primary" ${busy?"disabled":""} onclick="playHigherLower('lower')">▼ Niedriger</button>
      </div>
    </div>`;
}

/* ---------- RENDER: FREUNDE ---------- */
function renderFriends(){
  if (state.activeChatWith) return renderChatPanel();
  let html = `<div class="title">👥 Freunde</div>
  <div class="body-text" style="margin-bottom:16px;">Nutzer suchen, Freundschaftsanfragen senden, verwalten und schreiben.</div>
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
    const unread = state.unreadCounts[f._id];
    html += `<div class="card" style="text-align:center;">
      <div style="font-size:32px;">${f.avatar}</div>
      <div style="font-weight:600; margin:6px 0;">${escapeHtml(f.username)} ${unread?`<span style="background:var(--danger); color:white; border-radius:10px; padding:1px 7px; font-size:11px;">${unread}</span>`:""}</div>
      <div class="muted">Level ${f.progress.level}</div>
      <div style="display:flex; gap:6px; justify-content:center; margin-top:10px;">
        <button class="btn btn-primary" style="padding:6px 12px;" onclick='openChat(${JSON.stringify({id:f._id,username:f.username,avatar:f.avatar})})'>💬 Chat</button>
        <button class="btn btn-secondary" style="padding:6px 12px; color:var(--danger);" onclick="removeFriendUser('${f._id}')">Entfernen</button>
      </div>
    </div>`;
  });
  return html + `</div>`;
}
function renderChatPanel(){
  const f = state.activeChatWith;
  let html = `<button class="btn btn-secondary" onclick="closeChat()" style="margin-bottom:14px;">← Zurück</button>
  <div class="title">💬 ${f.avatar} ${escapeHtml(f.username)}</div>
  <div class="card" style="height:400px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">`;
  if (!state.chatMessages.length) html += `<div class="muted">Noch keine Nachrichten — schreib was!</div>`;
  state.chatMessages.forEach(m=>{
    const mine = m.fromUsername===state.currentUser;
    html += `<div style="align-self:${mine?'flex-end':'flex-start'}; max-width:70%; background:${mine?'var(--accent)':'var(--bg-panel)'}; color:${mine?'white':'var(--text-primary)'}; padding:8px 12px; border-radius:14px;">
      ${m.sticker ? `<span style="font-size:28px;">${(state.stickers.find(s=>s.id===m.sticker)||{}).emoji||''}</span>` : escapeHtml(m.text)}
      <div style="font-size:10px; opacity:.7; margin-top:4px;">${new Date(m.createdAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</div>
    </div>`;
  });
  html += `</div>
  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
    ${state.stickers.map(s=>`<button class="btn btn-secondary" style="padding:6px 10px; font-size:18px;" onclick="sendChatMessage('','${s.id}')" title="${escapeHtml(s.label)}">${s.emoji}</button>`).join("")}
  </div>
  <div style="display:flex; gap:8px;">
    <input id="chatInput" type="text" placeholder="Nachricht schreiben (keine Links erlaubt)..." style="flex:1;" onkeydown="if(event.key==='Enter'){sendChatMessage(this.value,null); this.value='';}"/>
    <button class="btn btn-primary" onclick="const i=document.getElementById('chatInput'); sendChatMessage(i.value,null); i.value='';">Senden</button>
  </div>`;
  return html;
}

/* ---------- RENDER: COOKIE CLICKER ---------- */
function renderCookieClicker(){
  const s = state.cookieState;
  const p = progress();
  let html = `<div class="section-title">Cookie Clicker</div>
  <div class="body-text" style="margin-bottom:6px;">Klick dich hoch, kauf Upgrades. Auszahlung wird serverseitig berechnet — nicht manipulierbar.</div>
  <div style="margin:6px 0 20px;">🪙 Coins: <b style="color:var(--coin);">${p.coins}</b> ${state.cookieClicks>0?`<span class="muted">(+${state.cookieClicks} Klicks werden gleich synchronisiert...)</span>`:""}</div>`;
  if (!s) return html + `<div class="body-text">Lade...</div>`;
  html += `
  <div class="two-col">
    <div class="card" style="text-align:center;">
      <div class="cookie-stage">
        <button onclick="clickCookie()" class="cookie-btn ${(state.cookieBounce||0)%2===0?'cb-a':'cb-b'}">🍪</button>
        ${state.cookieBounce ? `<div class="cookie-float" key="${state.cookieBounce}">+${s.clickPower}</div>` : ""}
      </div>
      <div class="muted" style="margin-top:10px;">Klick-Power: <b>${s.clickPower}</b> · Auto: <b>${s.autoPerSecond}/s</b> ${s.multiplier>1?`· <span style="color:var(--success);">x${s.multiplier.toFixed(2)} Abo-Boost</span>`:""}</div>
    </div>
    <div class="card">
      <div class="section-title">Upgrades</div>
      ${s.catalog.map(u=>`
        <div style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border);">
          <span style="font-size:22px;">${u.icon}</span>
          <div style="flex:1;"><b>${escapeHtml(u.name)}</b><div class="muted">Besessen: ${u.owned}</div></div>
          <button class="btn btn-secondary" ${p.coins<u.cost?"disabled":""} onclick="buyCookieUpgrade('${u.id}')">${u.cost} 🪙</button>
        </div>`).join("")}
    </div>
  </div>`;
  return html;
}

/* ---------- RENDER: FACTORY ---------- */
function renderFactory(){
  const s = state.factoryState;
  const p = progress();
  let html = `<div class="section-title">Factory</div>
  <div class="body-text" style="margin-bottom:6px;">Reines Idle-Spiel: Generatoren kaufen, Produktion läuft auch offline weiter. Beim Abholen rechnet der Server die vergangene Zeit serverseitig nach.</div>
  <div style="margin:6px 0 20px;">🪙 Coins: <b style="color:var(--coin);">${p.coins}</b></div>`;
  if (!s) return html + `<div class="body-text">Lade...</div>`;
  html += `
  <div class="card gradient-bg" style="text-align:center; margin-bottom:20px;">
    <div style="color:#ede9ff;">Wartend zum Abholen</div>
    <div style="font-size:32px; font-weight:700; color:white;">${s.pending} 🪙</div>
    <button class="btn" style="background:white; color:var(--ios-indigo); margin-top:10px;" onclick="collectFactory()">Abholen</button>
    <div class="muted" style="color:#ede9ff; margin-top:8px;">${s.coinsPerSecond}/s Produktion ${s.multiplier>1?`· x${s.multiplier.toFixed(2)} Abo-Boost`:""}</div>
  </div>
  <div class="card">
    <div class="section-title">Generatoren</div>
    ${s.catalog.map(g=>`
      <div style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border);">
        <span style="font-size:22px;">${g.icon}</span>
        <div style="flex:1;"><b>${escapeHtml(g.name)}</b><div class="muted">Besessen: ${g.owned} · +${g.cps}/s je Stück</div></div>
        <button class="btn btn-secondary" ${p.coins<g.cost?"disabled":""} onclick="buyFactoryGenerator('${g.id}')">${g.cost} 🪙</button>
      </div>`).join("")}
  </div>`;
  return html;
}

/* ---------- RENDER: ABO ---------- */
function renderSubscription(){
  const s = state.subscriptionState;
  let html = `<div class="title">💳 Abo</div>
  <div class="body-text" style="margin-bottom:16px;">Bezahlt ausschließlich mit Gems, kein Echtgeld.</div>`;
  if (!s) return html + `<div class="body-text">Lade...</div>`;
  html += `<div class="ach-grid">`;
  ["free","basic","pro"].forEach(key=>{
    const t = s.tiers[key];
    const active = s.currentTier===key;
    html += `<div class="card" style="${active?'border-color:var(--accent);':''}">
      <div class="section-title">${t.label} ${active?'<span style="color:var(--success);">✓ Aktiv</span>':''}</div>
      <div class="body-text" style="margin:8px 0 12px;">${escapeHtml(t.description)}</div>
      ${key!=="free" ? `<button class="btn btn-primary" ${s.gems<t.costGems?"disabled":""} onclick="buySubscriptionTier('${key}')">${t.costGems} 💎 ${t.durationHours?`(${t.durationHours}h)`:"(dauerhaft)"}</button>` : ""}
    </div>`;
  });
  return html + `</div>`;
}

/* ---------- RENDER: SPIELE-HUB (Arcade, Cookie Clicker, Factory, Casino in einem Modul) ---------- */
function renderGames(){
  if (state.arcadeGame) return `<div id="liveArea">${renderArcade()}</div>`; // laufendes Arcade-Spiel füllt die ganze Seite
  const tabs = [
    ["arcade", icon("gamepad",16), "Arcade"],
    ["cookie", icon("cookie",16), "Cookie Clicker"],
    ["factory", icon("factory",16), "Factory"],
    ["casino", icon("dice",16), "Casino"],
  ];
  const tabBar = `<div class="segmented" style="margin-bottom:20px;">${tabs.map(([k,ic,label])=>
    `<button class="${state.gamesTab===k?'active':''}" onclick="switchGamesTab('${k}')">${ic} ${label}</button>`
  ).join("")}</div>`;
  return `<div class="title">${icon("gamepad",26)} Spiele</div>
  <div class="body-text" style="margin-bottom:16px;">Alle Spiele an einem Ort — Arcade-Minispiele, Idle-Games und Casino.</div>
  ${tabBar}<div id="liveArea">${liveAreaInner()}</div>`;
}
// Liefert nur den Inhalt des dynamischen Spiel-Bereichs (ohne Sidebar/Tabs drumrum) —
// wird sowohl beim vollen render() als auch beim gezielten refreshLiveArea() genutzt,
// damit beide IMMER exakt dasselbe zeigen.
function liveAreaInner(){
  if (state.arcadeGame) return renderArcade();
  if (state.gamesTab==="cookie") return renderCookieClicker();
  if (state.gamesTab==="factory") return renderFactory();
  if (state.gamesTab==="casino") return renderCasino();
  return renderArcade();
}
// Aktualisiert NUR den Spiel-Bereich, ohne Sidebar/Navigation/Rest der Seite
// neu zu zeichnen -> kein Flackern mehr bei schnellen Spiel-Ticks (Pac-Man,
// Cookie-Klicks, Tap-Timer, Quiz-Rush-Timer, Slot-Spin).
function refreshLiveArea(){
  const el = document.getElementById("liveArea");
  if (!el){ render(); return; } // Zielbereich existiert (noch) nicht -> normaler voller Render als Fallback
  el.innerHTML = liveAreaInner();
}

/* ---------- RENDER: PROJEKTE / CODE-IDE ---------- */
function renderProjects(){
  if (state.activeProject) return renderProjectEditor();
  let html = `<div class="title">${icon("terminal",26)} Projekte</div>
  <div class="body-text" style="margin-bottom:6px;">Eigene Code-Projekte erstellen, speichern und ausführen.</div>
  <div class="body-text muted" style="margin-bottom:18px;">JavaScript, Python & Lua laufen direkt in deinem Browser (Sandbox-iframe bzw. WebAssembly/JS-VM) — kein externer Dienst, keine Wartezeit. Java/C++/C# sind aktuell nur zum Schreiben/Speichern da.</div>
  <button class="btn btn-primary" style="margin-bottom:20px;" onclick="createNewProject()">${icon("plus",16)} Neues Projekt</button>`;
  if (!state.projects) return html + `<div class="body-text">Lade Projekte...</div>`;
  if (!state.projects.length) return html + `<div class="body-text">Noch keine Projekte — leg dein erstes an!</div>`;
  html += `<div class="ach-grid">`;
  state.projects.forEach(p=>{
    const lang = PROJECT_LANGS.find(l=>l.id===p.language);
    const runnable = ["javascript","python","lua"].includes(p.language);
    html += `<div class="card" style="cursor:pointer;" onclick="openProject('${p._id}')">
      <div class="section-title" style="margin-bottom:4px;">${escapeHtml(p.name)}</div>
      <div class="pill" style="margin:0 8px 8px 0;">${lang?lang.label:p.language}</div>
      ${runnable ? `<span class="pill" style="background:rgba(48,209,88,0.16); color:var(--success);">${icon("play",11)} lauffähig</span>` : ""}
      <div class="muted" style="margin-top:8px;">Bearbeitet: ${new Date(p.updatedAt).toLocaleDateString('de-DE')}</div>
    </div>`;
  });
  return html + `</div>`;
}
function renderProjectEditor(){
  const p = state.activeProject;
  const lang = PROJECT_LANGS.find(l=>l.id===p.language);
  const out = state.codeOutput;
  const lineCount = (p.code||"").split("\n").length;
  const lineNumbers = Array.from({length:lineCount}, (_,i)=>i+1).join("\n");
  return `
  <button class="btn btn-secondary" onclick="closeProject()" style="margin-bottom:14px;">← Zurück</button>
  <div class="ide-window">
    <div class="ide-titlebar">
      <div class="ide-dots"><span></span><span></span><span></span></div>
      <div class="ide-tab">${icon("terminal",13)} ${escapeHtml(p.name)}</div>
      <div style="flex:1;"></div>
      <button class="btn btn-primary" style="padding:8px 16px;" ${state.codeRunning?"disabled":""} onclick="runActiveProject()">${icon("play",15)} ${state.codeRunning?"Läuft...":"Ausführen"}</button>
      <button class="btn btn-secondary" style="padding:8px 10px;" onclick="deleteActiveProject()">${icon("trash",15)}</button>
    </div>
    <div class="ide-body">
      <div class="ide-explorer">
        <div class="ide-explorer-title">Projekt</div>
        <div class="ide-file active">${icon("terminal",14)} ${escapeHtml(p.name)}</div>
      </div>
      <div class="ide-editor-wrap">
        <div class="ide-gutter" id="ideGutter">${lineNumbers}</div>
        <textarea class="code-editor ide-textarea" id="ideTextarea" spellcheck="false"
          oninput="editProjectCode(this.value); syncIdeGutter();" onkeydown="ideHandleTab(event);"
          onscroll="document.getElementById('ideGutter').scrollTop=this.scrollTop;">${escapeHtml(p.code||"")}</textarea>
      </div>
    </div>
    <div class="ide-statusbar">
      <span>${lang?lang.label:p.language}</span>
      <span class="muted">${lineCount} Zeilen</span>
      <span style="flex:1;"></span>
      <span class="muted">${p.dirty?"● Ungespeicherte Änderungen":"✓ Gespeichert"}</span>
    </div>
  </div>
  <div class="section-title" style="margin-top:18px;">${icon("activity",16)} Ausgabe</div>
  <div class="code-block ide-output" style="min-height:90px; white-space:pre-wrap;">${
    !out ? `<span class="muted">Noch nichts ausgeführt — klick auf "Ausführen".</span>`
    : out.compileStderr ? `<span style="color:var(--danger);">Compile-Fehler:\n${escapeHtml(out.compileStderr)}</span>`
    : (escapeHtml(out.stdout||"") + (out.stderr?`\n<span style="color:var(--danger);">${escapeHtml(out.stderr)}</span>`:"") || `<span class="muted">(keine Ausgabe)</span>`)
  }</div>`;
}
function syncIdeGutter(){
  const ta = document.getElementById("ideTextarea");
  const gutter = document.getElementById("ideGutter");
  if (!ta || !gutter) return;
  const lines = ta.value.split("\n").length;
  gutter.textContent = Array.from({length:lines}, (_,i)=>i+1).join("\n");
}

/* ---------- RENDER: HANDBUCH ---------- */
function renderHandbuch(){
  const tab = state.handbuchTab || "intro";
  const tabs = `<div class="segmented" style="margin-bottom:20px; flex-wrap:wrap;">
    <button class="${tab==='intro'?'active':''}" onclick="state.handbuchTab='intro'; render();">${icon("bookmark",15)} Was ist Code?</button>
    ${COURSES.map(c=>`<button class="${tab===c.id?'active':''}" onclick="state.handbuchTab='${c.id}'; render();">${c.icon} ${escapeHtml(c.title)}</button>`).join("")}
  </div>`;
  let inner;
  if (tab==="intro"){
    inner = HANDBUCH_INTRO.map(s=>`<div class="card" style="margin-bottom:14px;">
      <div class="section-title">${escapeHtml(s.h)}</div>
      <div class="body-text">${escapeHtml(s.body)}</div>
    </div>`).join("");
  } else {
    const rows = REFERENCE[tab] || [];
    inner = `<div class="card" style="padding:0; overflow-x:auto;"><table class="lb">
      <tr><th style="text-align:left; padding:10px;">Thema</th><th style="text-align:left;">Syntax</th><th style="text-align:left;">Hinweis</th></tr>
      ${rows.map(r=>`<tr>
        <td style="padding:10px; font-weight:600; white-space:nowrap;">${escapeHtml(r.topic)}</td>
        <td><div class="code-block" style="margin:6px 0; font-size:12.5px;">${escapeHtml(r.syntax)}</div></td>
        <td class="muted" style="padding:10px;">${escapeHtml(r.note)}</td>
      </tr>`).join("")}
    </table></div>`;
  }
  return `<div class="title">${icon("bookmark",26)} Handbuch</div>
  <div class="body-text" style="margin-bottom:16px;">Grundlagen für absolute Einsteiger und ein Spickzettel zum schnellen Nachschlagen pro Sprache.</div>
  ${tabs}${inner}`;
}

/* ---------- RENDER: ADMIN-PANEL ---------- */
function renderAdmin(){
  const tabBtn = (key,label)=>`<button class="btn ${state.adminTab===key?'btn-primary':'btn-secondary'}" style="padding:8px 14px;" onclick="setAdminTab('${key}')">${label}</button>`;
  let html = `<div class="title">🛡️ Admin-Panel</div>
  <div class="body-text" style="margin-bottom:16px;">Nutzerverwaltung, Rollen, Berechtigungen, Verwarnungen, Sperren, Entsperrungs-Anfragen und Live-Aktivität.</div>
  <div style="display:flex; gap:8px; margin-bottom:18px;">${tabBtn('users','👥 Nutzer')} ${tabBtn('unban','🔓 Entsperrungs-Anfragen')} ${tabBtn('activity','📜 Aktivität')}</div>`;
  if (state.adminTab==="activity") return html + renderAdminActivity();
  if (state.adminTab==="unban") return html + renderAdminUnban();
  return html + renderAdminUsersTab() + renderAdminEditModal();
}
function renderAdminUnban(){
  if (!state.adminUnbanRequests) return `<div class="body-text">Lade Anfragen...</div>`;
  if (!state.adminUnbanRequests.length) return `<div class="body-text">Keine offenen Entsperrungs-Anfragen.</div>`;
  let html = `<div class="ach-grid">`;
  state.adminUnbanRequests.forEach(r=>{
    html += `<div class="card">
      <div class="section-title">${escapeHtml(r.username)}</div>
      <div class="body-text" style="margin:8px 0 14px;">"${escapeHtml(r.reason)}"</div>
      <div class="muted" style="margin-bottom:10px;">${new Date(r.createdAt).toLocaleString('de-DE')}</div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary" style="flex:1;" onclick="reviewUnbanRequest('${r._id}', true)">Entsperren</button>
        <button class="btn btn-secondary" style="flex:1;" onclick="reviewUnbanRequest('${r._id}', false)">Ablehnen</button>
      </div>
    </div>`;
  });
  return html + `</div>`;
}
function renderAdminEditModal(){
  const u = state.adminEditingUser;
  if (!u) return "";
  const S = (field)=>`stat_${field}`; // Status-Span-ID je Feld
  return `
  <div class="modal-overlay">
    <div class="modal-box" style="width:440px; text-align:left; max-height:85vh; overflow-y:auto;">
      <div class="section-title">${icon("edit",16)} ${escapeHtml(u.username)} bearbeiten</div>
      <div class="muted" style="margin-bottom:10px;">Jedes Feld speichert sofort einzeln beim Verlassen — kein Sammel-Klick nötig.</div>

      <div class="field-label" style="display:flex; justify-content:space-between;">Avatar (Emoji) <span class="muted" id="${S('avatar')}"></span></div>
      <input value="${escapeHtml(u.avatar)}" onchange="adminSaveField('${u._id}','avatar',this.value,'${S('avatar')}')"/>

      <div class="field-label" style="display:flex; justify-content:space-between; margin-top:10px;">Bio <span class="muted" id="${S('bio')}"></span></div>
      <textarea rows="2" style="width:100%;" onchange="adminSaveField('${u._id}','bio',this.value,'${S('bio')}')">${escapeHtml(u.bio||"")}</textarea>

      <div class="field-label" style="display:flex; justify-content:space-between; margin-top:10px;">Rolle <span class="muted" id="${S('role')}"></span></div>
      <select style="width:100%; padding:10px;" onchange="adminSaveField('${u._id}','role',this.value,'${S('role')}')">
        ${(state.adminRoles||["user","moderator","admin"]).map(r=>`<option value="${r}" ${u.role===r?"selected":""}>${r}</option>`).join("")}
      </select>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
        <div><div class="field-label" style="display:flex; justify-content:space-between;">Coins <span class="muted" id="${S('coins')}"></span></div>
          <input type="number" min="0" max="10000000" value="${u.progress.coins}" onchange="adminSaveField('${u._id}','coins',Number(this.value),'${S('coins')}')"/></div>
        <div><div class="field-label" style="display:flex; justify-content:space-between;">Gems <span class="muted" id="${S('gems')}"></span></div>
          <input type="number" min="0" max="10000000" value="${u.progress.gems}" onchange="adminSaveField('${u._id}','gems',Number(this.value),'${S('gems')}')"/></div>
        <div><div class="field-label" style="display:flex; justify-content:space-between;">XP <span class="muted" id="${S('xp')}"></span></div>
          <input type="number" min="0" max="10000000" value="${u.progress.xp}" onchange="adminSaveField('${u._id}','xp',Number(this.value),'${S('xp')}')"/></div>
        <div><div class="field-label" style="display:flex; justify-content:space-between;">Level <span class="muted" id="${S('level')}"></span></div>
          <input type="number" min="1" value="${u.progress.level}" onchange="adminSaveField('${u._id}','level',Number(this.value),'${S('level')}')"/></div>
      </div>

      <div class="field-label" style="display:flex; justify-content:space-between; margin-top:10px;">Abo-Stufe <span class="muted" id="${S('subscriptionTier')}"></span></div>
      <select style="width:100%; padding:10px;" onchange="adminSaveField('${u._id}','subscriptionTier',this.value,'${S('subscriptionTier')}')">
        <option value="free" ${(!u.subscription||u.subscription.tier==='free')?"selected":""}>Learn Free</option>
        <option value="basic" ${u.subscription&&u.subscription.tier==='basic'?"selected":""}>Learn Basic</option>
        <option value="pro" ${u.subscription&&u.subscription.tier==='pro'?"selected":""}>Learn Pro</option>
      </select>

      <div class="section-title" style="margin-top:20px; font-size:14px;">Moderation</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin:8px 0;">
        <button class="btn btn-secondary" onclick="adminToggleMute('${u._id}', ${!u.isMuted})">${u.isMuted?icon("check",14)+' Entstummen':icon("ban",14)+' Stummschalten'}</button>
        <button class="btn btn-secondary" onclick="adminKickUser('${u._id}','${escapeHtml(u.username)}')">${icon("logout",14)} Rauswerfen</button>
      </div>
      ${u.warnings && u.warnings.length ? `
        <div class="muted" style="margin-bottom:6px;">Verwarnungen (${u.warnings.length}):</div>
        <div style="max-height:100px; overflow-y:auto; margin-bottom:10px;">
          ${u.warnings.map(w=>`<div class="body-text" style="font-size:12px; padding:4px 0; border-bottom:1px solid var(--border);">"${escapeHtml(w.reason)}" — ${escapeHtml(w.byAdmin)}, ${new Date(w.at).toLocaleDateString('de-DE')}</div>`).join("")}
        </div>` : ""}

      <div style="margin-top:8px; display:flex; align-items:center; gap:8px;">
        <input id="editBanned" type="checkbox" ${u.banned?"checked":""} style="width:auto;"
          onchange="adminSaveField('${u._id}','banned',this.checked,'${S('banned')}')"/>
        <label for="editBanned">Gesperrt</label> <span class="muted" id="${S('banned')}"></span>
      </div>
      <div class="field-label" style="margin-top:8px;">Sperrgrund <span class="muted" id="${S('banReason')}"></span></div>
      <input value="${escapeHtml(u.banReason||"")}" onchange="adminSaveField('${u._id}','banReason',this.value,'${S('banReason')}')"/>
      <div class="field-label" style="margin-top:8px;">Sperrdauer in Stunden (leer = dauerhaft, nur bei neuer Sperre)</div>
      <input type="number" min="1" placeholder="z.B. 24" onchange="adminSaveField('${u._id}','banDurationHours',this.value?Number(this.value):null,'${S('banDurationHours')}')"/>

      <button class="btn btn-primary" style="width:100%; margin-top:18px;" onclick="closeAdminEdit()">Fertig</button>
    </div>
  </div>`;
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
        ${u.isMuted ? `<span title="Stummgeschaltet" style="margin-left:4px;">${icon("ban",13)}</span>`:""}
      </td>
      <td>
        <select onchange="adminSetRole('${u._id}', this.value)" ${isSelf?"disabled":""}>
          ${(state.adminRoles||["user","moderator","admin"]).map(r=>`<option value="${r}" ${u.role===r?"selected":""}>${r}</option>`).join("")}
        </select>
      </td>
      <td><input type="number" min="0" max="10000000" id="coins_${u._id}" value="${u.progress.coins}" style="width:80px;"/></td>
      <td><input type="number" min="0" max="10000000" id="gems_${u._id}" value="${u.progress.gems}" style="width:70px;"/></td>
      <td><input type="number" min="0" max="10000000" id="xp_${u._id}" value="${u.progress.xp}" style="width:80px;"/></td>
      <td><input type="number" id="level_${u._id}" value="${u.progress.level}" style="width:60px;"/></td>
      <td>${u.banned ? `<span style="color:var(--danger);">🚫 Gesperrt</span>` : `<span style="color:var(--success);">✅ Aktiv</span>`}</td>
      <td style="display:flex; gap:6px; flex-wrap:wrap; padding:10px;">
        <button class="btn btn-primary" style="padding:6px 10px;" onclick="openAdminEdit('${u._id}')">${icon("edit",14)} Bearbeiten</button>
        <button class="btn btn-secondary" style="padding:6px 10px;" onclick="viewUserLogs('${escapeHtml(u.username)}')">${icon("activity",14)} Logs</button>
        <button class="btn btn-secondary" style="padding:6px 10px;" onclick="adminEditStats('${u._id}', document.getElementById('coins_${u._id}').value, document.getElementById('xp_${u._id}').value, document.getElementById('level_${u._id}').value, document.getElementById('gems_${u._id}').value)">💾</button>
        <button class="btn btn-secondary" style="padding:6px 10px;" onclick="adminWarnUser('${u._id}')">⚠️ Verwarnen</button>
        ${u.warnings && u.warnings.length ? `<button class="btn btn-secondary" style="padding:6px 10px;" onclick="adminClearWarnings('${u._id}')">Warns löschen</button>`:""}
        ${u.flagged ? `<button class="btn btn-secondary" style="padding:6px 10px; color:var(--warning);" onclick="adminClearFlag('${u._id}')">🚩 Entwarnen</button>`:""}
        <button class="btn btn-secondary" style="padding:6px 10px;" onclick="adminViewMessages('${u._id}', '${escapeHtml(u.username)}')">${icon("chat",14)} Nachrichten</button>
        <button class="btn btn-secondary" style="padding:6px 10px;" onclick="adminToggleMute('${u._id}', ${!u.isMuted})">${u.isMuted?icon("check",14):icon("ban",14)} ${u.isMuted?'Entstummen':'Stumm'}</button>
        <button class="btn btn-secondary" style="padding:6px 10px;" onclick="adminKickUser('${u._id}','${escapeHtml(u.username)}')">${icon("logout",14)} Kick</button>
        ${u.profilePicture ? `<button class="btn btn-secondary" style="padding:6px 10px;" onclick="adminResetPicture('${u._id}')">🖼️ Bild löschen</button>`:""}
        <button class="btn btn-secondary" style="padding:6px 10px;" ${isSelf?"disabled":""} onclick="adminSetBanned('${u._id}', ${!u.banned})">${u.banned?"Entsperren":"Sperren"}</button>
        <button class="btn btn-secondary" style="padding:6px 10px; color:var(--danger);" ${isSelf?"disabled":""} onclick="adminDeleteUser('${u._id}', '${escapeHtml(u.username)}')">🗑️</button>
      </td>
    </tr>`;
  });
  html += `</table></div>`;
  html += `<div class="body-text" style="margin-top:18px;">Rechte sind fest an den Rang gekoppelt: <b>Admin</b> darf alles, <b>Moderator</b> darf Nutzer einsehen/verwarnen/(zeitlich) sperren sowie Aktivität & Chats zur Moderation einsehen, <b>User</b> hat keine Admin-Rechte.</div>`;
  return html;
}
function renderAdminActivity(){
  if (!state.adminActivity){ return `<div class="body-text">Lade Aktivität...</div>`; }
  const ICONS = {register:"🆕",login:"🔑",ban:"🚫",unban:"✅",warn:"⚠️",role_change:"🛡️",shop_purchase:"🛒",casino_bet:"🎰",cheat_flag:"🚩",friend_request:"👥",friend_accept:"🤝"};
  let html = "";
  if (state.adminActivityFilter){
    html += `<div class="pill" style="background:rgba(255,122,26,0.18); color:var(--accent); margin-bottom:10px;">Gefiltert: ${escapeHtml(state.adminActivityFilter)}
      <button class="btn-ghost" style="padding:0 0 0 8px;" onclick="state.adminActivityFilter=null; loadAdminActivity();">✕</button></div>`;
  }
  html += `<div class="body-text" style="margin-bottom:14px;">Die letzten 200 Ereignisse (Logins, Käufe, Verwarnungen, Casino-Wetten, Cheat-Flags ...).</div>
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
  const avatars = AVATARS.map(a=>`<button class="btn btn-secondary avatar-pick ${u.avatar===a?'avatar-selected':''}" onclick="changeAvatar('${a}')">${a}</button>`).join("");
  const pic = u.profilePicture
    ? `<img src="${u.profilePicture}" style="width:100px; height:100px; border-radius:50px; object-fit:cover; margin:0 auto; display:block;">`
    : `<div class="gradient-bg" style="border-radius:50px; width:100px; height:100px; margin:0 auto; display:flex; align-items:center; justify-content:center; font-size:50px;">${u.avatar}</div>`;
  const templates = BANNER_TEMPLATES.map(t=>`<button class="banner-tpl ${u.bannerImage===t.id?'selected':''}" style="background:${t.css};" onclick="pickBannerTemplate('${t.id}'); saveProfileBanner();" title="${t.label}"></button>`).join("");
  return `
  <div class="title">${icon("user",26)} Profil</div>
  <div class="card" style="padding:0; overflow:hidden; margin-bottom:20px;">
    <div class="banner-drop" style="height:130px; border-radius:0; border:none; background:${bannerCssFor(u)};"
      ondragover="event.preventDefault();" ondrop="handleDropImage(event,'banner'); setTimeout(saveProfileBanner,50);">
      <label class="file-upload">
        <span class="file-btn">${icon("upload",16)} Banner ändern</span>
        <input type="file" accept="image/*" onchange="readAndUploadImage(this.files[0],'banner'); setTimeout(saveProfileBanner,50);"/>
      </label>
    </div>
    <div style="padding:14px 20px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
      ${templates}
      <span class="muted" style="margin-left:6px;">Farbe:</span>
      <input type="color" value="${u.bannerColor||'#ff7a1a'}" oninput="pickBannerColor(this.value)" onchange="saveProfileBanner()" style="width:38px; height:28px; padding:2px;"/>
    </div>
  </div>
  <div class="two-col">
    <div class="card" style="text-align:center;">
      ${pic}
      <div class="section-title" style="margin-top:14px;">${escapeHtml(state.currentUser)}</div>
      <div class="muted" style="margin-bottom:10px;">Dabei seit ${new Date(u.createdAt).toLocaleDateString('de-DE')}</div>
      <textarea id="bioInput" maxlength="160" placeholder="Kurze Bio (max. 160 Zeichen)..." style="width:100%; margin-bottom:8px;" rows="2">${escapeHtml(u.bio||"")}</textarea>
      <button class="btn btn-secondary" style="margin-bottom:16px;" onclick="saveBio(document.getElementById('bioInput').value)">Bio speichern</button>
      <div class="pfp-drop" style="width:100%; height:auto; border-radius:var(--radius-sm); padding:14px; margin-bottom:8px; flex-direction:column; gap:6px;"
        ondragover="event.preventDefault();" ondrop="handleDropImage(event,'picture'); setTimeout(saveProfilePictureField,50);">
        <label class="file-upload">
          <span class="file-btn">${icon("upload",16)} Bild hochladen oder hierher ziehen</span>
          <input type="file" accept="image/*" onchange="readAndUploadImage(this.files[0],'picture'); setTimeout(saveProfilePictureField,50);"/>
        </label>
      </div>
      ${u.profilePicture ? `<div><button class="btn-ghost" onclick="removeProfilePicture()">Bild entfernen</button></div>`:""}
      <div class="muted" style="margin:16px 0 8px;">Oder Emoji-Avatar wählen:</div>
      <div>${avatars}</div>
      <div class="muted" style="margin:18px 0 8px;">Lieblingssprache (Badge auf deinem Profil):</div>
      <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
        ${COURSES.map(c=>`<button class="course-badge ${u.favoriteCourse===c.id?'selected':''}" style="--badge-color:${c.color};" onclick="saveFavoriteCourse('${c.id}')">${c.icon} ${escapeHtml(c.title)}</button>`).join("")}
      </div>
    </div>
    <div class="card">
      <div class="section-title">📊 Lernstatistik</div>
      <div class="quick-grid" style="grid-template-columns:repeat(2,1fr);">
        <div><div class="muted">LEVEL</div><div style="font-size:20px; font-weight:700;">${p.level}</div></div>
        <div><div class="muted">COINS</div><div style="font-size:20px; font-weight:700; color:var(--coin);">${p.coins}</div></div>
        <div><div class="muted">GEMS</div><div style="font-size:20px; font-weight:700; color:var(--gem);">${p.gems}</div></div>
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
    <div class="section-title">Profil anpassen</div>
    <div class="field-label">Nutzername</div>
    <div style="display:flex; gap:8px; margin-bottom:10px;">
      <input id="settingsUsername" type="text" value="${escapeHtml(state.currentUser)}" style="flex:1;"/>
      <button class="btn btn-secondary" onclick="changeUsername(document.getElementById('settingsUsername').value)">Ändern</button>
    </div>
    <div class="field-label">Bio</div>
    <textarea id="settingsBio" rows="2" maxlength="160" style="width:100%; margin-bottom:8px;">${escapeHtml(u.bio||"")}</textarea>
    <button class="btn btn-secondary" style="margin-bottom:12px;" onclick="saveBio(document.getElementById('settingsBio').value)">Bio speichern</button>
    <div class="muted">Avatar, Profilbild und Banner kannst du im <button class="btn-ghost" onclick="goto('profile')">Profil</button> ändern.</div>
  </div>
  <div class="card" style="width:480px; margin-bottom:16px;">
    <div class="section-title">Konto</div>
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
    <div class="section-title">Über CodeBase</div>
    <div class="body-text">Eine spielerische Lernplattform für mehrere Programmiersprachen mit Arcade-Minispielen, Coin-Wirtschaft und Leaderboard.</div>
  </div>
  <div class="card" style="width:480px; margin-top:16px;">
    <div class="section-title">Rechtliches</div>
    <div style="display:flex; gap:10px; margin-bottom:${state.settingsLegal?'14px':'0'};">
      <button class="btn-ghost" onclick="state.settingsLegal = state.settingsLegal==='impressum'?null:'impressum'; render();">Impressum</button>
      <button class="btn-ghost" onclick="state.settingsLegal = state.settingsLegal==='datenschutz'?null:'datenschutz'; render();">Datenschutz</button>
    </div>
    ${state.settingsLegal ? legalContent(state.settingsLegal) : ""}
  </div>`;
}

/* ---------- MASTER RENDER ---------- */
function render(){
  const app = document.getElementById("app");
  if (state.booting){ app.innerHTML = renderBoot() + renderModal(); return; }
  if (!state.currentUser){ app.innerHTML = renderAuth() + renderModal(); return; }
  if (state.page==="onboarding"){ app.innerHTML = renderOnboarding() + renderModal(); return; }
  let inner = "";
  switch(state.page){
    case "dashboard": inner = renderDashboard(); break;
    case "learning": inner = renderLearning(); break;
    case "exercises": inner = renderPractice(); break;
    case "achievements": inner = renderAchievements(); break;
    case "games": case "arcade": case "cookie": case "factory": case "casino": inner = renderGames(); break;
    case "projects": inner = renderProjects(); break;
    case "handbuch": inner = renderHandbuch(); break;
    case "shop": inner = renderShop(); break;
    case "subscription": inner = renderSubscription(); break;
    case "friends": inner = renderFriends(); break;
    case "leaderboard": inner = renderLeaderboard(); break;
    case "profile": inner = renderProfile(); break;
    case "settings": inner = renderSettings(); break;
    case "admin": inner = (isAdminUser()||hasPermission("users.view")) ? renderAdmin() : renderDashboard(); break;
    default: inner = renderDashboard();
  }
  app.innerHTML = renderShell(inner) + renderModal() + renderTutorial();
  scheduleProgressSync(); // Fortschritt im Hintergrund mit dem Server abgleichen
}
