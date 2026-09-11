/* ---------- STATE ---------- */
let state = {
  modal: null,         // {kind:'alert'|'confirm'|'prompt', title, message, value, resolve}
  users: {},          // username -> {id, avatar, createdAt, role, permissions, ownedAvatars, progress:{...}}
  currentUser: null,
  page: "dashboard",
  course: "csharp",   // aktuell gewählter Lern-Kurs (siehe COURSES in data.js)
  lessonId: null,
  lessonInstances: [],
  practiceInstances: [],
  arcadeGame: null,   // null | 'bubble' | 'tap' | 'memory' | 'quizrush'
  gamesTab: "arcade", // aktiver Tab im Spiele-Hub: arcade | cookie | factory | casino
  bubble: null,
  tap: null,
  memory: null,
  quizrush: null,
  authError: "",
  authMode: "login",
  authBusy: false,
  wasBannedUsername: null, // gefüllt, wenn Login wegen Sperre fehlschlug -> zeigt Entsperrungs-Formular
  booting: true,      // true bis /api/auth/me einmal geprüft wurde
  tutorialStep: 0,
  showTutorial: false,
  leaderboardRows: null,
  leaderboardSort: "xp",
  shop: null,          // {items, owned, coins}
  adminUsers: null,
  adminQuery: "",
  adminActivity: null,
  adminActivityFilter: null, // Username-Filter für den Aktivitäts-Tab
  projects: null,
  activeProject: null,
  codeOutput: null,
  codeRunning: false,
  adminTab: "users",   // "users" | "activity" | "unban"
  adminEditingUser: null, // aktuell im Vollbild-Editor geöffneter Nutzer
  adminUnbanRequests: null,
  soundOn: true,
  casinoBusy: false,
  casinoResult: null,  // letztes Casino-Ergebnis (für Animation/Anzeige)
  casinoSpinFrame: null, // aktuell angezeigte Zufallssymbole während des Slot-Spins
  friendsData: null,   // {friends, incoming, outgoing}
  friendSearchResults: [],
  cookieState: null,
  cookieClicks: 0,       // seit letztem Server-Sync gesammelte Klicks (lokal, wird periodisch synced)
  factoryState: null,
  subscriptionState: null,
  activeChatWith: null,  // {id, username, avatar}
  chatMessages: [],
  stickers: [],
  unreadCounts: {},      // friendId -> Anzahl ungelesener Nachrichten
};

function newProgress(){
  return {
    level:1, xp:0, coins:50, gems:0, totalCoinsEarned:50,
    streak:0, lastLearnDate:null,
    completedLessons:[], completedExercises:[], unlocked:[],
    totalSolved:0, currentStreak:0, bestStreak:0,
    bubbleHigh:0, tapHigh:0, memoryHigh:0, quizRushHigh:0,
    memoryPerfect:0, quizRushBestStreak:0,
    arcadePlays:0, gamesPlayed:{},
    daily:{date:todayStr(), exToday:0, lessonsToday:0, xpToday:0, claimed:false},
  };
}
function todayStr(){ return new Date().toDateString(); }
function xpForLevel(level){ return 500 + (level-1)*250; }
function progress(){ return state.users[state.currentUser].progress; }

function addXp(p, amount){
  if (amount<=0) return false;
  p.xp += amount;
  let leveled = false;
  while (p.xp >= xpForLevel(p.level)) { p.xp -= xpForLevel(p.level); p.level++; leveled = true; }
  return leveled;
}
function addCoins(p, amount){
  if (amount<=0) return;
  p.coins += amount; p.totalCoinsEarned += amount;
}
function addGems(p, amount){
  if (amount<=0) return;
  p.gems += amount;
}
function registerLearningDay(p){
  const t = todayStr();
  if (!p.lastLearnDate) p.streak = 1;
  else if (p.lastLearnDate === t) { /* heute schon aktiv */ }
  else {
    const y = new Date(); y.setDate(y.getDate()-1);
    if (p.lastLearnDate === y.toDateString()) p.streak += 1;
    else p.streak = 1;
  }
  p.lastLearnDate = t;
  if (p.daily.date !== t) p.daily = {date:t, exToday:0, lessonsToday:0, xpToday:0, claimed:false};
}
function checkAchievements(p){
  const unlocked = [];
  ACHIEVEMENTS.forEach(a=>{
    if (!p.unlocked.includes(a.id) && a.check(p)){
      p.unlocked.push(a.id); addXp(p,a.xp); addCoins(p,a.coins); addGems(p, a.gems||0); unlocked.push(a);
    }
  });
  return unlocked;
}
function recordExercise(p, exDef, exId, correct){
  registerLearningDay(p);
  if (correct){
    // Sicherheit: Belohnung gibt es WIRKLICH nur beim allerersten Lösen einer
    // Aufgabe — jedes weitere Mal (z.B. durch "Neue Aufgaben mischen") zählt
    // zwar für den aktuellen Streak, bringt aber 0 XP/Coins. Kein Farmen mehr möglich.
    const firstTime = !p.completedExercises.includes(exId);
    p.currentStreak++; p.bestStreak = Math.max(p.bestStreak, p.currentStreak);
    if (firstTime){
      p.completedExercises.push(exId);
      p.totalSolved++;
      p.daily.exToday++;
      p.daily.xpToday += exDef.xp;
      addXp(p, exDef.xp); addCoins(p, exDef.coins);
    }
  } else {
    p.currentStreak = 0;
  }
  checkAchievements(p);
}
function completeLesson(p, lesson){
  registerLearningDay(p);
  if (!p.completedLessons.includes(lesson.id)){
    p.completedLessons.push(lesson.id);
    p.daily.lessonsToday++; p.daily.xpToday += lesson.xp;
    addXp(p, lesson.xp);
  }
  checkAchievements(p);
}
function lessonUnlocked(lesson, p){ return !lesson.req || p.completedLessons.includes(lesson.req); }

/* ---------- MULTI-KURS-HELFER ---------- */
function lessonsForCourse(courseId){ return LESSONS.filter(l=>(l.course||"csharp")===courseId); }
function exerciseCourse(exId){
  const def = EXERCISES[exId];
  const lesson = def && LESSONS.find(l=>l.id===def.lesson);
  return (lesson && lesson.course) || "csharp";
}

/* Gemeinsamer Einsatz-/Buchungs-Helfer für alle Arcade-Spiele.
   gameKey wird für die "Allrounder"-Errungenschaft mitgezählt. */
function spendForGame(gameKey, cost){
  const p = progress();
  if (p.coins < cost) return false;
  p.coins -= cost;
  p.arcadePlays++;
  p.gamesPlayed[gameKey] = (p.gamesPlayed[gameKey]||0) + 1;
  checkAchievements(p);
  return true;
}
function payoutForGame(score){
  const p = progress();
  const coinsEarned = Math.max(0, Math.floor(score/10));
  addCoins(p, coinsEarned);
  checkAchievements(p);
  return coinsEarned;
}
