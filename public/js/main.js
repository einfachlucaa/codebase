/* ---------- NAVIGATION ---------- */
function goto(page){
  if (page==="admin" && !isAdminUser() && !hasPermission("users.view")) return; // Guard: kein Zugriff ohne Berechtigung
  stopAdminLivePoll();
  state.page = page;
  if (page==="learning"){ state.lessonId=null; }
  if (page==="exercises"){ loadPractice(); }
  if (page!=="games" && !["arcade","cookie","factory","casino"].includes(page)){ exitArcadeTimers(); state.arcadeGame=null; }
  render();
  if (page==="leaderboard") loadLeaderboard();
  if (page==="shop") loadShop();
  if (page==="friends") { loadFriends(); loadUnreadCounts(); }
  if (page==="games") switchGamesTab(state.gamesTab||"arcade");
  if (page==="subscription") loadSubscription();
  if (page==="projects") loadProjects();
  if (page==="admin") { loadAdminUsers(); startAdminLivePoll(); }
}
function switchGamesTab(tab){
  state.gamesTab = tab; state.page="games"; state.arcadeGame=null; exitArcadeTimers();
  render();
  if (tab==="cookie") loadCookieState();
  if (tab==="factory") loadFactoryState();
}
function exitArcadeTimers(){
  stopTapTimer();
  stopQuizRushTimer();
  stopPacmanTimer();
}
function openLesson(id){
  state.lessonId = id;
  state.lessonInstances = LESSONS.find(l=>l.id===id).ex.map(makeInstance);
  render();
}
function backToLessons(){ state.lessonId=null; render(); }
function loadPractice(){
  const ids = Object.keys(EXERCISES).filter(id=>exerciseCourse(id)===state.course);
  shuffle(ids);
  state.practiceInstances = ids.slice(0,8).map(makeInstance);
}
function switchCourse(courseId){
  if (state.course===courseId) return;
  state.course = courseId; state.lessonId = null;
  if (state.page==="exercises") loadPractice();
  render();
}
function exitArcadeGame(){ exitArcadeTimers(); state.arcadeGame=null; render(); }

/* ---------- PERMISSIONS (client-seitig nur fürs UI, echte Prüfung macht der Server) ---------- */
function isAdminUser(){
  const u = state.users[state.currentUser];
  return !!u && u.role === "admin";
}
// Rollen -> Rechte, muss zu src/config/permissions.js (ROLE_DEFAULTS) passen.
const ROLE_DEFAULTS_CLIENT = {
  user: [],
  moderator: ["users.view","users.warn","users.ban","activity.view","messages.view"],
  admin: ["users.view","users.edit","users.ban","users.warn","users.delete","users.roles","activity.view","messages.view"],
};
function hasPermission(perm){
  const u = state.users[state.currentUser];
  if (!u) return false;
  if (u.role === "admin") return true;
  return (ROLE_DEFAULTS_CLIENT[u.role]||[]).includes(perm);
}

/* ---------- SERVER-USER -> LOKALER STATE ---------- */
function hydrateUser(serverUser){
  state.users[serverUser.username] = {
    id: serverUser._id,
    avatar: serverUser.avatar,
    profilePicture: serverUser.profilePicture || null,
    bannerImage: serverUser.bannerImage || null,
    bannerColor: serverUser.bannerColor || "#ff7a1a",
    bio: serverUser.bio || "",
    onboarded: !!serverUser.onboarded,
    tutorialSeen: !!serverUser.tutorialSeen,
    favoriteCourse: serverUser.favoriteCourse || null,
    createdAt: serverUser.createdAt,
    role: serverUser.role,
    permissions: serverUser.permissions || [],
    ownedAvatars: serverUser.ownedAvatars || [],
    warnings: serverUser.warnings || [],
    flagged: !!serverUser.flagged,
    subscription: serverUser.subscription || {tier:"free", expiresAt:null},
    progress: Object.assign(newProgress(), serverUser.progress),
  };
  state.currentUser = serverUser.username;
}

/* ---------- AUTH-ROUTING: /login und /register als echte URLs,
   Erstbesucher landen automatisch auf Registrieren, Wiederkehrer auf Login ---------- */
function determineInitialAuthMode(){
  const path = window.location.pathname;
  if (path === "/login") return "login";
  if (path === "/register") return "register";
  return localStorage.getItem("cb_visited") ? "login" : "register";
}
function syncAuthUrl(mode){
  const path = "/" + mode;
  if (window.location.pathname !== path) history.pushState({authMode:mode}, "", path);
}
window.addEventListener("popstate", ()=>{
  if (!state.currentUser){
    const path = window.location.pathname;
    if (path==="/login" || path==="/register"){ state.authMode = path.slice(1); render(); }
  }
});

/* ---------- AUTH ---------- */
async function doLogin(username, password){
  if (state.authBusy) return;
  state.authBusy = true; state.authError=""; state.wasBannedUsername=null; render();
  try{
    const { user } = await apiPost("/auth/login", { username:(username||"").trim(), password });
    hydrateUser(user);
    enterApp();
  } catch(err){
    state.authError = err.message;
    if (err.status===403) state.wasBannedUsername = (username||"").trim(); // zeigt "Entsperrung beantragen"-Option
  } finally {
    state.authBusy = false; render();
  }
}
async function submitUnbanRequest(username, reason){
  if (!reason || !reason.trim()){ await customAlert("Bitte gib einen Grund an."); return; }
  try{
    await apiPost("/auth/unban-request", { username, reason: reason.trim() });
    state.wasBannedUsername = null;
    await customAlert("Deine Entsperrungs-Anfrage wurde übermittelt. Ein Admin prüft sie.", "Anfrage gesendet");
    render();
  } catch(err){ await customAlert(err.message); }
}
async function doRegister(username, password, passwordConfirm){
  if (state.authBusy) return;
  if (password !== passwordConfirm){
    state.authError = "Die Passwörter stimmen nicht überein."; render(); return;
  }
  state.authBusy = true; state.authError=""; render();
  try{
    const { user } = await apiPost("/auth/register", { username:(username||"").trim(), password });
    hydrateUser(user);
    enterApp();
  } catch(err){
    state.authError = err.message;
  } finally {
    state.authBusy = false; render();
  }
}
async function logout(){
  exitArcadeTimers();
  try{ await apiPost("/auth/logout"); } catch{ /* egal, Cookie lokal trotzdem verwerfen */ }
  state.currentUser=null; state.page="dashboard"; state.adminUsers=null; state.shop=null;
  state.authMode = "login"; syncAuthUrl("login"); // nach Logout direkt zum Login, nicht zur Registrierung
  render();
}
function setAuthMode(m){ state.authMode=m; state.authError=""; syncAuthUrl(m); render(); }

async function changeAvatar(av){
  const u = state.users[state.currentUser];
  const prev = u.avatar;
  u.avatar = av; render(); // optimistisch sofort anzeigen
  try{
    await apiPatch("/progress/profile", { avatar: av });
  } catch(err){
    u.avatar = prev; state.authError = err.message; render();
  }
}

/* ---------- PROGRESS-SYNC (debounced, läuft im Hintergrund nach jeder render()) ---------- */
let _syncTimer = null;
function scheduleProgressSync(){
  if (!state.currentUser) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async ()=>{
    const u = state.users[state.currentUser];
    if (!u) return;
    try{ await apiPut("/progress", { progress: u.progress }); }
    catch(err){ console.warn("Sync fehlgeschlagen:", err.message); }
  }, 800);
}

/* ---------- BOOTSTRAP: laufende Session wiederherstellen (Login übersteht Reload) ---------- */
async function bootstrap(){
  try{
    const { user } = await apiGet("/auth/me");
    hydrateUser(user);
    if (!user.onboarded) state.page = "onboarding";
    else if (!user.tutorialSeen) { state.tutorialStep = 0; state.showTutorial = true; }
  } catch {
    // nicht eingeloggt -> Login/Register-Screen. Erstbesucher (noch nie hier
    // gewesen) landen auf "Registrieren", Wiederkehrer direkt auf "Login".
    state.authMode = determineInitialAuthMode();
    syncAuthUrl(state.authMode);
    localStorage.setItem("cb_visited", "1");
  }
  state.booting = false;
  render();
}

/* ---------- LEADERBOARD (aus MongoDB, alle Spieler serverweit) ---------- */
async function loadLeaderboard(sortBy){
  state.leaderboardSort = sortBy || state.leaderboardSort;
  try{
    const { rows } = await apiGet(`/leaderboard?sortBy=${state.leaderboardSort}&limit=50`);
    state.leaderboardRows = rows;
  } catch(err){ state.leaderboardRows = []; }
  render();
}

/* ---------- SHOP (Premium-Avatare kaufen) ---------- */
async function loadShop(){
  try{ state.shop = await apiGet("/shop"); }
  catch(err){ state.shop = null; }
  render();
}
async function buyShopAvatar(avatar){
  try{
    const { user } = await apiPost("/shop/buy-avatar", { avatar });
    hydrateUser(user);
    await loadShop();
  } catch(err){ customAlert(err.message); }
}

/* ---------- SOUND-TOGGLE ---------- */
function toggleSound(){ state.soundOn = !state.soundOn; if(state.soundOn) playSound("notify"); render(); }

/* ---------- CASINO (serverseitig berechnet, nur virtuelle Coins) ---------- */
async function playCasinoCoinflip(bet, choice){
  if (state.casinoBusy) return;
  state.casinoBusy = true; state.casinoResult = null; render();
  try{
    const res = await apiPost("/casino/coinflip", { bet, choice });
    state.users[state.currentUser].progress.coins = res.coins;
    state.casinoResult = { game:"coinflip", ...res };
    playSound(res.win ? "win" : "lose");
  } catch(err){ await customAlert(err.message); }
  finally{ state.casinoBusy = false; render(); }
}
async function pullSlotLever(){
  if (state.casinoBusy) return;
  const betInput = document.getElementById("slBet");
  const bet = betInput ? betInput.value : 20;
  state.casinoBusy = true; state.casinoResult = null; render();

  // Während der Anfrage rasch durch zufällige Symbole "spinnen" lassen —
  // rein optisch, das tatsächliche Ergebnis kommt weiterhin vom Server.
  const SYMS = ["cherry","lemon","bell","star","diamond"];
  const randomFrame = ()=> [0,0,0].map(()=>SYMS[Math.floor(Math.random()*SYMS.length)]);
  state.casinoSpinFrame = randomFrame(); render();
  const spinTimer = setInterval(()=>{ state.casinoSpinFrame = randomFrame(); render(); }, 90);

  try{
    const [res] = await Promise.all([
      apiPost("/casino/slots", { bet }),
      new Promise(r=>setTimeout(r, 650)), // Mindest-Spin-Dauer, damit die Animation nicht "blinzelt"
    ]);
    state.users[state.currentUser].progress.coins = res.coins;
    state.casinoResult = { game:"slots", ...res };
    playSound(res.payout>0 ? "win" : "lose");
  } catch(err){ await customAlert(err.message); }
  finally{ clearInterval(spinTimer); state.casinoBusy = false; render(); }
}
async function playHigherLower(guess){
  if (state.casinoBusy) return;
  const betInput = document.getElementById("hlBet");
  const bet = betInput ? betInput.value : 20;
  state.casinoBusy = true; state.casinoResult = null; render();
  try{
    const res = await apiPost("/casino/higherlower", { bet, guess });
    state.users[state.currentUser].progress.coins = res.coins;
    state.casinoResult = { game:"higherlower", guess, ...res };
    playSound(res.win ? "win" : "lose");
  } catch(err){ await customAlert(err.message); }
  finally{ state.casinoBusy = false; render(); }
}

/* ---------- FREUNDE ---------- */
async function loadFriends(){
  try{ state.friendsData = await apiGet("/friends"); }
  catch(err){ state.friendsData = {friends:[],incoming:[],outgoing:[]}; }
  render();
}
async function searchFriendUsers(q){
  if (!q || q.trim().length<2){ state.friendSearchResults = []; render(); return; }
  try{ const {users} = await apiGet(`/friends/search?q=${encodeURIComponent(q.trim())}`); state.friendSearchResults = users; }
  catch{ state.friendSearchResults = []; }
  render();
}
async function sendFriendRequest(id){
  try{ await apiPost(`/friends/request/${id}`); playSound("notify"); await loadFriends(); }
  catch(err){ customAlert(err.message); }
}
async function respondFriendRequest(id, accept){
  try{ await apiPost(`/friends/respond/${id}`, { accept }); await loadFriends(); }
  catch(err){ customAlert(err.message); }
}
async function removeFriendUser(id){
  if (!(await customConfirm("Diese Freundschaft wirklich beenden?"))) return;
  try{ await apiDelete(`/friends/${id}`); await loadFriends(); }
  catch(err){ customAlert(err.message); }
}

/* ---------- COOKIE CLICKER ---------- */
async function loadCookieState(){
  try{ state.cookieState = await apiGet("/idle/cookie"); }
  catch(err){ state.cookieState = null; }
  render();
}
function clickCookie(){
  state.cookieClicks++;
  playSound("click");
  scheduleCookieSync();
  render(); // schnelles visuelles Feedback, Server-Sync passiert gebündelt (siehe unten)
}
let _cookieSyncTimer = null;
function scheduleCookieSync(){
  clearTimeout(_cookieSyncTimer);
  _cookieSyncTimer = setTimeout(syncCookieClicks, 2000);
}
async function syncCookieClicks(){
  if (state.cookieClicks<=0 && !state.currentUser) return;
  const clicks = state.cookieClicks; state.cookieClicks = 0;
  try{
    const res = await apiPost("/idle/cookie/collect", { clicks });
    state.users[state.currentUser].progress.coins = res.coins;
    await loadCookieState();
  } catch(err){ /* still egal, nächster Sync holt es nach */ }
}
async function buyCookieUpgrade(upgradeId){
  await syncCookieClicks();
  try{
    await apiPost("/idle/cookie/upgrade", { upgradeId });
    playSound("coin");
    await loadCookieState();
  } catch(err){ customAlert(err.message); }
}

/* ---------- FACTORY (Idle) ---------- */
async function loadFactoryState(){
  try{ state.factoryState = await apiGet("/idle/factory"); }
  catch(err){ state.factoryState = null; }
  render();
}
async function collectFactory(){
  try{
    const res = await apiPost("/idle/factory/collect");
    state.users[state.currentUser].progress.coins = res.coins;
    if (res.earned>0) playSound("coin");
    await loadFactoryState();
  } catch(err){ customAlert(err.message); }
}
async function buyFactoryGenerator(generatorId){
  try{
    await apiPost("/idle/factory/upgrade", { generatorId });
    playSound("coin");
    await loadFactoryState();
  } catch(err){ customAlert(err.message); }
}

/* ---------- ABO-SYSTEM ---------- */
async function loadSubscription(){
  try{ state.subscriptionState = await apiGet("/subscription"); }
  catch(err){ state.subscriptionState = null; }
  render();
}
async function buySubscriptionTier(tier){
  if (!(await customConfirm(`Bist du sicher? Das Abo wird sofort mit Gems bezahlt.`))) return;
  try{
    const { user } = await apiPost("/subscription/buy", { tier });
    hydrateUser(user);
    playSound("win");
    await loadSubscription();
  } catch(err){ customAlert(err.message); }
}

/* ---------- CHAT (nur Text + Sticker, nur zwischen Freunden) ---------- */
async function loadStickers(){
  if (state.stickers.length) return;
  try{ const {stickers} = await apiGet("/messages/stickers"); state.stickers = stickers; } catch{}
}
async function loadUnreadCounts(){
  try{
    const {unread} = await apiGet("/messages/unread");
    state.unreadCounts = {}; unread.forEach(u=>{ state.unreadCounts[u.from]=u.count; });
  } catch{}
}
async function openChat(friend){
  state.activeChatWith = friend;
  state.chatMessages = [];
  render();
  await loadStickers();
  await loadChatMessages();
}
async function loadChatMessages(){
  if (!state.activeChatWith) return;
  try{
    const {messages} = await apiGet(`/messages/${state.activeChatWith.id}`);
    state.chatMessages = messages;
    await loadUnreadCounts();
  } catch(err){ customAlert(err.message); state.activeChatWith=null; }
  render();
}
async function sendChatMessage(text, stickerId){
  if (!state.activeChatWith) return;
  if (!text.trim() && !stickerId) return;
  try{
    await apiPost(`/messages/${state.activeChatWith.id}`, { text, sticker: stickerId||null });
    playSound("notify");
    await loadChatMessages();
  } catch(err){ customAlert(err.message); }
}
function closeChat(){ state.activeChatWith = null; render(); }

/* ---------- PROFIL: BILD-UPLOAD & BIO ---------- */
function uploadProfilePicture(input){
  const file = input.files[0];
  if (!file) return;
  if (file.size > 350*1024){ customAlert("Bild ist zu groß (max. 350KB)."); return; }
  const reader = new FileReader();
  reader.onload = async (e)=>{
    try{
      const { user } = await apiPatch("/progress/profile", { picture: e.target.result });
      hydrateUser(user);
      render();
    } catch(err){ customAlert(err.message); }
  };
  reader.readAsDataURL(file);
}
async function removeProfilePicture(){
  try{ const { user } = await apiPatch("/progress/profile", { picture: null }); hydrateUser(user); render(); }
  catch(err){ customAlert(err.message); }
}
async function saveBio(text){
  try{ const { user } = await apiPatch("/progress/profile", { bio: text }); hydrateUser(user); render(); }
  catch(err){ customAlert(err.message); }
}

/* ---------- ADMIN: MODERATION ---------- */
async function adminViewMessages(id, username){
  try{
    const { messages } = await apiGet(`/admin/users/${id}/messages`);
    let text = messages.length ? messages.map(m=>`[${new Date(m.createdAt).toLocaleString('de-DE')}] ${m.fromUsername} -> ${m.toUsername}: ${m.text||''} ${m.sticker?'('+m.sticker+')':''}`).join("\n") : "Keine Nachrichten.";
    customAlert(`Nachrichten von ${username}:\n\n${text}`);
  } catch(err){ customAlert(err.message); }
}
async function adminResetPicture(id){
  try{ await apiPatch(`/admin/users/${id}/reset-picture`, {}); await loadAdminUsers(); }
  catch(err){ customAlert(err.message); }
}

/* ---------- APP-EINSTIEG NACH LOGIN/REGISTER: Pflicht-Onboarding + Tutorial ---------- */
function enterApp(){
  history.pushState({}, "", "/"); // /login oder /register verlassen, sobald man drin ist
  const u = state.users[state.currentUser];
  if (!u.onboarded){ state.page = "onboarding"; render(); return; }
  goto("dashboard");
  if (!u.tutorialSeen){ state.tutorialStep = 0; state.showTutorial = true; }
  render();
}
const BANNER_TEMPLATES = [
  { id:"tpl-sunset", label:"Sonnenuntergang", css:"linear-gradient(120deg,#ff7a1a,#ff375f)" },
  { id:"tpl-ocean", label:"Ozean", css:"linear-gradient(120deg,#0a84ff,#64d2ff)" },
  { id:"tpl-forest", label:"Wald", css:"linear-gradient(120deg,#1c6b3a,#30d158)" },
  { id:"tpl-royal", label:"Royal", css:"linear-gradient(120deg,#5e5ce6,#ff375f)" },
  { id:"tpl-mono", label:"Mono", css:"linear-gradient(120deg,#2c2c2e,#1c1c1e)" },
  { id:"tpl-gold", label:"Gold", css:"linear-gradient(120deg,#ffd60a,#ff9f0a)" },
  { id:"tpl-neon", label:"Neon", css:"linear-gradient(120deg,#00f5d4,#ff375f)" },
  { id:"tpl-lava", label:"Lava", css:"linear-gradient(120deg,#ff453a,#8b0000)" },
  { id:"tpl-grape", label:"Traube", css:"linear-gradient(120deg,#8e2de2,#4a00e0)" },
  { id:"tpl-mint", label:"Mint", css:"linear-gradient(120deg,#30d158,#64d2ff)" },
];
function bannerCssFor(u){
  if (u.bannerImage && u.bannerImage.startsWith("data:")) return `url('${u.bannerImage}') center/cover`;
  const tpl = BANNER_TEMPLATES.find(t=>t.id===u.bannerImage);
  if (tpl) return tpl.css;
  return `linear-gradient(120deg, ${u.bannerColor||'#ff7a1a'}, #1c1c1e)`;
}
function pickBannerTemplate(id){
  const u = state.users[state.currentUser];
  u.bannerImage = id; render();
}
function pickBannerColor(hex){
  const u = state.users[state.currentUser];
  u.bannerImage = null; u.bannerColor = hex; render();
}
function pickFavoriteCourse(id){
  const u = state.users[state.currentUser];
  u.favoriteCourse = (u.favoriteCourse===id) ? null : id; render();
}
function handleDropImage(ev, target){
  ev.preventDefault();
  const file = ev.dataTransfer.files && ev.dataTransfer.files[0];
  if (file) readAndUploadImage(file, target);
}
function readAndUploadImage(file, target){
  if (file.size > 350*1024){ customAlert("Bild ist zu groß (max. 350KB)."); return; }
  const reader = new FileReader();
  reader.onload = (e)=>{
    const u = state.users[state.currentUser];
    if (target==="picture") u.profilePicture = e.target.result;
    else u.bannerImage = e.target.result;
    render();
  };
  reader.readAsDataURL(file);
}
async function saveOnboarding(){
  const u = state.users[state.currentUser];
  const bio = document.getElementById("onbBio") ? document.getElementById("onbBio").value : u.bio;
  try{
    const { user } = await apiPatch("/progress/profile", {
      picture: u.profilePicture, banner: u.bannerImage, bannerColor: u.bannerColor, bio, favoriteCourse: u.favoriteCourse,
    });
    hydrateUser(user);
    await apiPatch("/progress/onboarding-complete");
    state.users[state.currentUser].onboarded = true;
    enterApp();
  } catch(err){ await customAlert(err.message); }
}
function nextTutorialStep(){
  if (state.tutorialStep >= TUTORIAL_STEPS.length-1){ finishTutorial(); return; }
  state.tutorialStep++; render();
}
async function finishTutorial(){
  state.showTutorial = false; render();
  try{ await apiPatch("/progress/tutorial-complete"); state.users[state.currentUser].tutorialSeen = true; }
  catch{ /* nicht kritisch, Tutorial würde beim nächsten Login halt nochmal erscheinen */ }
}

async function saveProfileBanner(){
  const u = state.users[state.currentUser];
  try{ const { user } = await apiPatch("/progress/profile", { banner: u.bannerImage, bannerColor: u.bannerColor }); hydrateUser(user); render(); }
  catch(err){ await customAlert(err.message); }
}
async function saveProfilePictureField(){
  const u = state.users[state.currentUser];
  try{ const { user } = await apiPatch("/progress/profile", { picture: u.profilePicture }); hydrateUser(user); render(); }
  catch(err){ await customAlert(err.message); }
}
async function saveFavoriteCourse(id){
  const u = state.users[state.currentUser];
  const newVal = (u.favoriteCourse===id) ? null : id;
  try{ const { user } = await apiPatch("/progress/profile", { favoriteCourse: newVal }); hydrateUser(user); render(); }
  catch(err){ await customAlert(err.message); }
}

/* ---------- PROJEKTE / CODE-IDE ---------- */
const PROJECT_LANGS = [
  { id:"python", label:"Python" }, { id:"javascript", label:"JavaScript" },
  { id:"java", label:"Java" }, { id:"cpp", label:"C++" },
  { id:"lua", label:"Lua" }, { id:"csharp", label:"C#" },
];
async function loadProjects(){
  try{ const {projects} = await apiGet("/projects"); state.projects = projects; }
  catch(err){ state.projects = []; }
  render();
}
async function createNewProject(){
  const name = await customPrompt("Name des Projekts:", "", "Neues Projekt");
  if (!name || !name.trim()) return;
  const lang = await customPrompt("Sprache (python/javascript/java/cpp/lua/csharp):", "python", "Sprache wählen");
  if (!lang) return;
  const langId = PROJECT_LANGS.find(l=>l.id===lang.trim().toLowerCase())?.id;
  if (!langId){ await customAlert("Unbekannte Sprache. Erlaubt: python, javascript, java, cpp, lua, csharp"); return; }
  try{
    const { project } = await apiPost("/projects", { name: name.trim(), language: langId });
    await loadProjects();
    openProject(project._id);
  } catch(err){ await customAlert(err.message); }
}
function openProject(id){
  state.activeProject = state.projects.find(p=>p._id===id);
  state.codeOutput = null;
  render();
}
function closeProject(){ state.activeProject = null; state.codeOutput = null; render(); }
let _projectSaveTimer = null;
function editProjectCode(code){
  state.activeProject.code = code;
  clearTimeout(_projectSaveTimer);
  _projectSaveTimer = setTimeout(saveActiveProject, 900);
}
async function saveActiveProject(){
  if (!state.activeProject) return;
  try{ await apiPatch(`/projects/${state.activeProject._id}`, { code: state.activeProject.code }); }
  catch(err){ /* still egal, nächster Save-Versuch holt es nach */ }
}
async function runActiveProject(){
  if (!state.activeProject || state.codeRunning) return;
  await saveActiveProject();
  state.codeRunning = true; state.codeOutput = null; render();
  try{
    const result = await apiPost("/code/run", { language: state.activeProject.language, code: state.activeProject.code });
    state.codeOutput = result;
    playSound(result.stderr || result.compileStderr ? "wrong" : "correct");
  } catch(err){ state.codeOutput = { stderr: err.message }; }
  finally{ state.codeRunning = false; render(); }
}
async function deleteActiveProject(){
  if (!state.activeProject) return;
  if (!(await customConfirm(`Projekt "${state.activeProject.name}" wirklich löschen?`))) return;
  try{
    await apiDelete(`/projects/${state.activeProject._id}`);
    state.activeProject = null;
    await loadProjects();
  } catch(err){ await customAlert(err.message); }
}

/* ---------- ADMIN-PANEL ---------- */
async function loadAdminUsers(){
  if (!isAdminUser() && !hasPermission("users.view")) return;
  try{
    const { users, permissionList, roles } = await apiGet(`/admin/users?q=${encodeURIComponent(state.adminQuery||"")}`);
    state.adminUsers = users; state.adminPermissionList = permissionList; state.adminRoles = roles;
  } catch(err){ state.adminUsers = []; }
  render();
}
function adminSearch(q){ state.adminQuery = q; loadAdminUsers(); }
async function adminEditStats(id, coins, xp, level, gems){
  try{
    await apiPatch(`/admin/users/${id}/stats`, { coins:Number(coins), xp:Number(xp), level:Number(level), gems:Number(gems) });
    await loadAdminUsers();
    playSound("notify");
  } catch(err){ await customAlert("Speichern fehlgeschlagen: " + err.message, "Fehler"); }
}
async function adminSetRole(id, role){
  try{ await apiPatch(`/admin/users/${id}/role`, { role }); await loadAdminUsers(); }
  catch(err){ customAlert(err.message); }
}

function openAdminEdit(id){
  state.adminEditingUser = state.adminUsers.find(u=>u._id===id);
  render();
}
function closeAdminEdit(){ state.adminEditingUser = null; render(); }
async function loadUnbanRequests(){
  try{ const {requests} = await apiGet("/admin/unban-requests"); state.adminUnbanRequests = requests; }
  catch(err){ state.adminUnbanRequests = []; }
  render();
}
async function reviewUnbanRequest(id, approve){
  try{ await apiPost(`/admin/unban-requests/${id}/review`, { approve }); await loadUnbanRequests(); await loadAdminUsers(); }
  catch(err){ await customAlert(err.message); }
}

/* ---------- ADMIN: PER-FELD-AUTOSAVE (robuster als ein großes Formular) ---------- */
async function adminSaveField(id, field, value, statusElId){
  const statusEl = statusElId ? document.getElementById(statusElId) : null;
  if (statusEl) statusEl.textContent = "Speichere...";
  try{
    const { user } = await apiPatch(`/admin/users/${id}/full`, { [field]: value });
    if (state.adminEditingUser) Object.assign(state.adminEditingUser, field==="coins"||field==="gems"||field==="xp"||field==="level" ? {} : {});
    const idx = state.adminUsers.findIndex(u=>u._id===id);
    if (idx>-1) state.adminUsers[idx] = user;
    if (state.adminEditingUser && state.adminEditingUser._id===id) state.adminEditingUser = user;
    if (statusEl) statusEl.textContent = "✓ Gespeichert";
    playSound("notify");
  } catch(err){
    if (statusEl) statusEl.textContent = "✗ " + err.message;
  }
}
async function adminKickUser(id, username){
  if (!(await customConfirm(`${username} sofort rauswerfen? Login-Sitzung wird ungültig, Account bleibt aktiv.`))) return;
  try{ await apiPost(`/admin/users/${id}/kick`); await customAlert(`${username} wurde rausgeworfen.`, "Erledigt"); }
  catch(err){ await customAlert(err.message); }
}
async function adminToggleMute(id, muted){
  try{ await apiPatch(`/admin/users/${id}/mute`, { muted }); await loadAdminUsers(); }
  catch(err){ await customAlert(err.message); }
}

async function adminWarnUser(id){
  const reason = await customPrompt("Grund für die Verwarnung:", "", "Nutzer verwarnen");
  if (!reason || !reason.trim()) return;
  try{
    const { autoBanned } = await apiPost(`/admin/users/${id}/warn`, { reason: reason.trim() });
    if (autoBanned) customAlert("Nutzer hat die maximale Anzahl Verwarnungen erreicht und wurde automatisch gesperrt.");
    await loadAdminUsers();
  } catch(err){ customAlert(err.message); }
}
async function adminClearWarnings(id){
  if (!(await customConfirm("Alle Verwarnungen dieses Nutzers löschen?"))) return;
  try{ await apiDelete(`/admin/users/${id}/warnings`); await loadAdminUsers(); }
  catch(err){ customAlert(err.message); }
}
async function adminClearFlag(id){
  try{ await apiPatch(`/admin/users/${id}/clear-flag`, {}); await loadAdminUsers(); }
  catch(err){ customAlert(err.message); }
}
async function loadAdminActivity(){
  try{ const {logs} = await apiGet(`/admin/activity${state.adminActivityFilter?`?username=${encodeURIComponent(state.adminActivityFilter)}`:""}`); state.adminActivity = logs; }
  catch(err){ state.adminActivity = []; }
  render();
}
function viewUserLogs(username){
  state.adminActivityFilter = username;
  setAdminTab("activity");
}
function setAdminTab(tab){ state.adminTab = tab; render(); if (tab==="activity") loadAdminActivity(); if (tab==="unban") loadUnbanRequests(); }

/* ---------- ADMIN: LIVE-AKTUALISIERUNG ---------- */
let _adminPollTimer = null;
function startAdminLivePoll(){
  stopAdminLivePoll();
  _adminPollTimer = setInterval(()=>{
    if (state.page!=="admin") { stopAdminLivePoll(); return; }
    if (state.adminEditingUser) return; // nicht mittendrin im Bearbeiten stören
    if (state.adminTab==="users") loadAdminUsers();
    else if (state.adminTab==="activity") loadAdminActivity();
    else if (state.adminTab==="unban") loadUnbanRequests();
  }, 6000);
}
function stopAdminLivePoll(){ if (_adminPollTimer){ clearInterval(_adminPollTimer); _adminPollTimer=null; } }

async function adminSetBanned(id, banned){
  const reason = banned ? ((await customPrompt("Grund für die Sperre (optional):", "", "Nutzer sperren"))||"") : "";
  try{ await apiPatch(`/admin/users/${id}/ban`, { banned, reason }); await loadAdminUsers(); }
  catch(err){ customAlert(err.message); }
}
async function adminDeleteUser(id, username){
  if (!(await customConfirm(`Konto "${username}" wirklich unwiderruflich löschen?`))) return;
  try{ await apiDelete(`/admin/users/${id}`); await loadAdminUsers(); }
  catch(err){ customAlert(err.message); }
}

/* ---------- LOKALES BACKUP (zusätzlich zur MongoDB-Speicherung) ---------- */
function exportProgress(){
  const u = state.users[state.currentUser];
  const data = JSON.stringify({username: state.currentUser, progress: u.progress}, null, 2);
  const blob = new Blob([data], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "csharp-quest-fortschritt.json";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- BOOTSTRAP ---------- */
bootstrap();
