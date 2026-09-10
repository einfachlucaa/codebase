/* ---------- NAVIGATION ---------- */
function goto(page){
  if (page==="admin" && !isAdminUser()) return; // Guard: kein Zugriff ohne Berechtigung
  state.page = page;
  if (page==="learning"){ state.lessonId=null; }
  if (page==="exercises"){ loadPractice(); }
  if (page!=="arcade"){ exitArcadeTimers(); state.arcadeGame=null; }
  render();
  if (page==="leaderboard") loadLeaderboard();
  if (page==="shop") loadShop();
  if (page==="friends") { loadFriends(); loadUnreadCounts(); }
  if (page==="cookie") loadCookieState();
  if (page==="factory") loadFactoryState();
  if (page==="subscription") loadSubscription();
  if (page==="admin") loadAdminUsers();
}
function exitArcadeTimers(){
  stopTapTimer();
  stopQuizRushTimer();
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
function hasPermission(perm){
  const u = state.users[state.currentUser];
  if (!u) return false;
  if (u.role === "admin") return true;
  return (u.permissions||[]).includes(perm);
}

/* ---------- SERVER-USER -> LOKALER STATE ---------- */
function hydrateUser(serverUser){
  state.users[serverUser.username] = {
    id: serverUser._id,
    avatar: serverUser.avatar,
    profilePicture: serverUser.profilePicture || null,
    bio: serverUser.bio || "",
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

/* ---------- AUTH ---------- */
async function doLogin(username, password){
  if (state.authBusy) return;
  state.authBusy = true; state.authError=""; render();
  try{
    const { user } = await apiPost("/auth/login", { username:(username||"").trim(), password });
    hydrateUser(user);
    goto("dashboard");
  } catch(err){
    state.authError = err.message;
  } finally {
    state.authBusy = false; render();
  }
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
    goto("dashboard");
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
  render();
}
function setAuthMode(m){ state.authMode=m; state.authError=""; render(); }

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
  } catch { /* nicht eingeloggt -> Login-Screen */ }
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
  } catch(err){ alert(err.message); }
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
  } catch(err){ alert(err.message); }
  finally{ state.casinoBusy = false; render(); }
}
async function playCasinoSlots(bet){
  if (state.casinoBusy) return;
  state.casinoBusy = true; state.casinoResult = null; render();
  try{
    const res = await apiPost("/casino/slots", { bet });
    state.users[state.currentUser].progress.coins = res.coins;
    state.casinoResult = { game:"slots", ...res };
    playSound(res.payout>0 ? "win" : "lose");
  } catch(err){ alert(err.message); }
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
  catch(err){ alert(err.message); }
}
async function respondFriendRequest(id, accept){
  try{ await apiPost(`/friends/respond/${id}`, { accept }); await loadFriends(); }
  catch(err){ alert(err.message); }
}
async function removeFriendUser(id){
  if (!confirm("Diese Freundschaft wirklich beenden?")) return;
  try{ await apiDelete(`/friends/${id}`); await loadFriends(); }
  catch(err){ alert(err.message); }
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
  } catch(err){ alert(err.message); }
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
  } catch(err){ alert(err.message); }
}
async function buyFactoryGenerator(generatorId){
  try{
    await apiPost("/idle/factory/upgrade", { generatorId });
    playSound("coin");
    await loadFactoryState();
  } catch(err){ alert(err.message); }
}

/* ---------- ABO-SYSTEM ---------- */
async function loadSubscription(){
  try{ state.subscriptionState = await apiGet("/subscription"); }
  catch(err){ state.subscriptionState = null; }
  render();
}
async function buySubscriptionTier(tier){
  if (!confirm(`Bist du sicher? Das Abo wird sofort mit Gems bezahlt.`)) return;
  try{
    const { user } = await apiPost("/subscription/buy", { tier });
    hydrateUser(user);
    playSound("win");
    await loadSubscription();
  } catch(err){ alert(err.message); }
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
  } catch(err){ alert(err.message); state.activeChatWith=null; }
  render();
}
async function sendChatMessage(text, stickerId){
  if (!state.activeChatWith) return;
  if (!text.trim() && !stickerId) return;
  try{
    await apiPost(`/messages/${state.activeChatWith.id}`, { text, sticker: stickerId||null });
    playSound("notify");
    await loadChatMessages();
  } catch(err){ alert(err.message); }
}
function closeChat(){ state.activeChatWith = null; render(); }

/* ---------- PROFIL: BILD-UPLOAD & BIO ---------- */
function uploadProfilePicture(input){
  const file = input.files[0];
  if (!file) return;
  if (file.size > 350*1024){ alert("Bild ist zu groß (max. 350KB)."); return; }
  const reader = new FileReader();
  reader.onload = async (e)=>{
    try{
      const { user } = await apiPatch("/progress/profile", { picture: e.target.result });
      hydrateUser(user);
      render();
    } catch(err){ alert(err.message); }
  };
  reader.readAsDataURL(file);
}
async function removeProfilePicture(){
  try{ const { user } = await apiPatch("/progress/profile", { picture: null }); hydrateUser(user); render(); }
  catch(err){ alert(err.message); }
}
async function saveBio(text){
  try{ const { user } = await apiPatch("/progress/profile", { bio: text }); hydrateUser(user); render(); }
  catch(err){ alert(err.message); }
}

/* ---------- ADMIN: MODERATION ---------- */
async function adminViewMessages(id, username){
  try{
    const { messages } = await apiGet(`/admin/users/${id}/messages`);
    let text = messages.length ? messages.map(m=>`[${new Date(m.createdAt).toLocaleString('de-DE')}] ${m.fromUsername} -> ${m.toUsername}: ${m.text||''} ${m.sticker?'('+m.sticker+')':''}`).join("\n") : "Keine Nachrichten.";
    alert(`Nachrichten von ${username}:\n\n${text}`);
  } catch(err){ alert(err.message); }
}
async function adminResetPicture(id){
  try{ await apiPatch(`/admin/users/${id}/reset-picture`, {}); await loadAdminUsers(); }
  catch(err){ alert(err.message); }
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
  } catch(err){ alert(err.message); }
}
async function adminSetRole(id, role){
  try{ await apiPatch(`/admin/users/${id}/role`, { role }); await loadAdminUsers(); }
  catch(err){ alert(err.message); }
}
async function adminTogglePermission(id, perm, checked){
  const u = state.adminUsers.find(x=>x._id===id);
  const current = new Set(u.permissions||[]);
  checked ? current.add(perm) : current.delete(perm);
  try{ await apiPatch(`/admin/users/${id}/permissions`, { permissions:[...current] }); await loadAdminUsers(); }
  catch(err){ alert(err.message); }
}
async function adminWarnUser(id){
  const reason = prompt("Grund für die Verwarnung:");
  if (!reason || !reason.trim()) return;
  try{
    const { autoBanned } = await apiPost(`/admin/users/${id}/warn`, { reason: reason.trim() });
    if (autoBanned) alert("Nutzer hat die maximale Anzahl Verwarnungen erreicht und wurde automatisch gesperrt.");
    await loadAdminUsers();
  } catch(err){ alert(err.message); }
}
async function adminClearWarnings(id){
  if (!confirm("Alle Verwarnungen dieses Nutzers löschen?")) return;
  try{ await apiDelete(`/admin/users/${id}/warnings`); await loadAdminUsers(); }
  catch(err){ alert(err.message); }
}
async function adminClearFlag(id){
  try{ await apiPatch(`/admin/users/${id}/clear-flag`, {}); await loadAdminUsers(); }
  catch(err){ alert(err.message); }
}
async function loadAdminActivity(){
  try{ const { logs } = await apiGet("/admin/activity"); state.adminActivity = logs; }
  catch(err){ state.adminActivity = []; }
  render();
}
function setAdminTab(tab){ state.adminTab = tab; render(); if (tab==="activity") loadAdminActivity(); }

async function adminSetBanned(id, banned){
  const reason = banned ? (prompt("Grund für die Sperre (optional):")||"") : "";
  try{ await apiPatch(`/admin/users/${id}/ban`, { banned, reason }); await loadAdminUsers(); }
  catch(err){ alert(err.message); }
}
async function adminDeleteUser(id, username){
  if (!confirm(`Konto "${username}" wirklich unwiderruflich löschen?`)) return;
  try{ await apiDelete(`/admin/users/${id}`); await loadAdminUsers(); }
  catch(err){ alert(err.message); }
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
