/* ---------- STATE ---------- */
let state = {
  users: {},          // username -> {id, avatar, createdAt, role, permissions, ownedAvatars, progress:{...}}
  currentUser: null,
  page: "dashboard",
  lessonId: null,
  lessonInstances: [],
  practiceInstances: [],
  arcadeGame: null,   // null | 'bubble' | 'tap' | 'memory' | 'quizrush'
  bubble: null,
  tap: null,
  memory: null,
  quizrush: null,
  authError: "",
  authMode: "login",
  authBusy: false,
  booting: true,      // true bis /api/auth/me einmal geprüft wurde
  leaderboardRows: null,
  leaderboardSort: "xp",
  shop: null,          // {items, owned, coins}
  adminUsers: null,
  adminQuery: "",
  adminActivity: null,
  adminTab: "users",   // "users" | "activity"
  soundOn: true,
  casinoBusy: false,
  casinoResult: null,  // letztes Casino-Ergebnis (für Animation/Anzeige)
  friendsData: null,   // {friends, incoming, outgoing}
  friendSearchResults: [],
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
    // Sicherheitsfix: volle XP/Coins nur beim ERSTEN Lösen einer Aufgabe.
    // Vorher konnte man durch "Neue Aufgaben mischen" dieselbe Aufgabe beliebig
    // oft neu bekommen und unendlich XP/Coins farmen. Wiederholtes Üben gibt
    // jetzt nur noch einen kleinen Übungsbonus (20%).
    const firstTime = !p.completedExercises.includes(exId);
    if (firstTime) p.completedExercises.push(exId);
    p.totalSolved++; p.currentStreak++; p.bestStreak = Math.max(p.bestStreak, p.currentStreak);
    p.daily.exToday++;
    const xpGain = firstTime ? exDef.xp : Math.ceil(exDef.xp*0.2);
    const coinGain = firstTime ? exDef.coins : Math.ceil(exDef.coins*0.2);
    p.daily.xpToday += xpGain;
    addXp(p, xpGain); addCoins(p, coinGain);
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
