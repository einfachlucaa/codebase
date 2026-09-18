const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const logActivity = require("../utils/logActivity");

// Felder, die der Client überhaupt syncen darf — alles andere wird ignoriert,
// damit niemand beliebige Mongo-Felder (role, banned, ...) über diesen Endpunkt setzt.
const ALLOWED_FIELDS = [
  "level", "xp", "coins", "gems", "totalCoinsEarned", "streak", "lastLearnDate",
  "completedLessons", "completedExercises", "unlocked", "totalSolved",
  "currentStreak", "bestStreak", "bubbleHigh", "tapHigh", "memoryHigh",
  "quizRushHigh", "memoryPerfect", "quizRushBestStreak", "arcadePlays", "pacmanHigh",
  "gamesPlayed", "daily", "exerciseCooldowns", "lessonCooldowns", "examCooldowns", "examsPassed", "examsPerfect",
];

// HINWEIS (Sicherheit): Die eigentliche Spiellogik (XP/Coins-Berechnung) läuft
// im Frontend. Ein technisch versierter Nutzer könnte über die DevTools
// Werte manipulieren. Deshalb hier ein mehrstufiges serverseitiges Sicherheitsnetz:
//  1) Mindestabstand zwischen zwei Syncs -> verhindert Skript-Spam auf den Endpunkt.
//  2) Harte Obergrenze für Coins/XP-Zuwachs PRO TAG (serverseitig gezählt, nicht
//     vom Client übernommen) -> verhindert Farmen durch Modul-Wechsel/Reload-Loops.
//  3) Auffällige Accounts werden automatisch geflaggt und erscheinen im Admin-Panel.
const MIN_SYNC_INTERVAL_MS = 1500;
const MAX_XP_PER_DAY = 400;   // an die deutlich abgeschwächte Wirtschaft angepasst (vorher 3000)
const MAX_COINS_PER_DAY = 200; // vorher 1500
const MAX_GEMS_PER_DAY = 20; // Gems sind bewusst selten, deshalb ein enges Tageslimit

function todayStr() {
  return new Date().toDateString();
}

const getProgress = asyncHandler(async (req, res) => {
  res.json({ progress: req.user.progress });
});

const saveProgress = asyncHandler(async (req, res) => {
  const incoming = req.body.progress;
  if (!incoming || typeof incoming !== "object") {
    throw new ApiError(400, "progress-Objekt fehlt.");
  }
  const user = req.user;

  // 1) Rate-Limit: zu schnelle, aufeinanderfolgende Syncs blocken (Skript-Verdacht).
  if (user.lastSyncAt && Date.now() - user.lastSyncAt.getTime() < MIN_SYNC_INTERVAL_MS) {
    throw new ApiError(429, "Zu viele Anfragen. Bitte kurz warten.");
  }
  user.lastSyncAt = new Date();

  // 2) Tages-Zähler zurücksetzen, falls neuer Tag.
  const today = todayStr();
  if (user.dailyEconomy.date !== today) {
    user.dailyEconomy = { date: today, xpGained: 0, coinsGained: 0, gemsGained: 0 };
  }

  const before = user.progress;
  const coinsDelta = Math.max(0, (incoming.coins ?? before.coins) - before.coins);
  const xpDelta = Math.max(0, (incoming.totalCoinsEarned ?? before.totalCoinsEarned) - before.totalCoinsEarned);
  const gemsDelta = Math.max(0, (incoming.gems ?? before.gems) - before.gems);

  user.dailyEconomy.xpGained += xpDelta;
  user.dailyEconomy.coinsGained += coinsDelta;
  user.dailyEconomy.gemsGained += gemsDelta;

  // 3) Tageslimit überschritten -> Sync ablehnen UND Account zur Kontrolle flaggen.
  if (
    user.dailyEconomy.xpGained > MAX_XP_PER_DAY ||
    user.dailyEconomy.coinsGained > MAX_COINS_PER_DAY ||
    user.dailyEconomy.gemsGained > MAX_GEMS_PER_DAY
  ) {
    user.flagged = true;
    user.flagReason = `Tageslimit überschritten am ${today} (XP: ${user.dailyEconomy.xpGained}, Coins: ${user.dailyEconomy.coinsGained}, Gems: ${user.dailyEconomy.gemsGained})`;
    await user.save();
    logActivity(user, "cheat_flag", { xpGained: user.dailyEconomy.xpGained, coinsGained: user.dailyEconomy.coinsGained, gemsGained: user.dailyEconomy.gemsGained });
    throw new ApiError(429, "Tageslimit für XP/Coins/Gems erreicht. Dein Account wurde zur Kontrolle markiert.");
  }

  for (const field of ALLOWED_FIELDS) {
    if (incoming[field] !== undefined) {
      user.progress[field] = incoming[field];
    }
  }
  user.markModified("progress");
  await user.save();
  res.json({ progress: user.progress });
});

const IMAGE_SIGNATURES = [
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF" (WEBP-Header danach)
];
const MAX_PICTURE_BYTES = 350 * 1024; // ~350KB, damit MongoDB-Dokumente klein bleiben

function validateImageDataUri(dataUri, label){
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUri || "");
  if (!match) throw new ApiError(400, `Ungültiges Bildformat (${label}).`);
  const buf = Buffer.from(match[2], "base64");
  if (buf.length > MAX_PICTURE_BYTES) throw new ApiError(400, `${label} zu groß (max. 350KB).`);
  const validSignature = IMAGE_SIGNATURES.some((sig) => sig.bytes.every((b, i) => buf[i] === b));
  if (!validSignature) throw new ApiError(400, `${label} ist kein unterstütztes Bildformat (PNG/JPEG/GIF/WEBP).`);
  return dataUri;
}
function validateProfilePicture(dataUri){ return validateImageDataUri(dataUri, "Profilbild"); }

const updateProfile = asyncHandler(async (req, res) => {
  const { avatar, picture, bio, banner, bannerColor, favoriteCourse } = req.body;
  if (avatar) {
    const owns = req.user.ownedAvatars.includes(avatar);
    const FREE_AVATARS = ["🧑‍💻", "👩‍💻", "🧑‍🚀", "🦊", "🐱", "🐼", "🐧", "🦄", "🐸", "🤖", "🐨", "🦁"];
    if (!owns && !FREE_AVATARS.includes(avatar)) {
      throw new ApiError(403, "Dieser Avatar wurde noch nicht freigeschaltet.");
    }
    req.user.avatar = avatar;
  }
  if (picture !== undefined) {
    req.user.profilePicture = picture === null ? null : validateProfilePicture(picture);
  }
  if (banner !== undefined) {
    // banner ist entweder ein Bild (data:image/...) ODER eine Template-ID (z.B. "tpl-sunset") -> nur Bilder validieren.
    req.user.bannerImage = (banner === null || !String(banner).startsWith("data:")) ? banner : validateImageDataUri(banner, "Banner");
  }
  if (bannerColor !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(bannerColor)) throw new ApiError(400, "Ungültiger Farbwert.");
    req.user.bannerColor = bannerColor;
  }
  if (favoriteCourse !== undefined) {
    req.user.favoriteCourse = favoriteCourse ? String(favoriteCourse).slice(0, 30) : null;
  }
  if (bio !== undefined) {
    req.user.bio = String(bio).slice(0, 160);
  }
  await req.user.save();
  res.json({ user: req.user });
});

// Pflicht-Onboarding nach der Registrierung abgeschlossen (Profilbild/Banner/Bio-Screen).
const completeOnboarding = asyncHandler(async (req, res) => {
  req.user.onboarded = true;
  await req.user.save();
  res.json({ user: req.user });
});
// Einführungs-Tour (Discord-artiges Tutorial) beendet.
const completeTutorial = asyncHandler(async (req, res) => {
  req.user.tutorialSeen = true;
  await req.user.save();
  res.json({ user: req.user });
});

module.exports = { getProgress, saveProgress, updateProfile, completeOnboarding, completeTutorial };
