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
  const ids = Object.keys(EXERCISES);
  shuffle(ids);
  state.practiceInstances = ids.slice(0,8).map(makeInstance);
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
    createdAt: serverUser.createdAt,
    role: serverUser.role,
    permissions: serverUser.permissions || [],
    ownedAvatars: serverUser.ownedAvatars || [],
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
async function adminEditStats(id, coins, xp, level){
  try{
    await apiPatch(`/admin/users/${id}/stats`, { coins:Number(coins), xp:Number(xp), level:Number(level) });
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
