const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// Felder, die der Client überhaupt syncen darf — alles andere wird ignoriert,
// damit niemand beliebige Mongo-Felder (role, banned, ...) über diesen Endpunkt setzt.
const ALLOWED_FIELDS = [
  "level", "xp", "coins", "totalCoinsEarned", "streak", "lastLearnDate",
  "completedLessons", "completedExercises", "unlocked", "totalSolved",
  "currentStreak", "bestStreak", "bubbleHigh", "tapHigh", "memoryHigh",
  "quizRushHigh", "memoryPerfect", "quizRushBestStreak", "arcadePlays",
  "gamesPlayed", "daily",
];

// HINWEIS (Sicherheit): Der Fortschritt wird hier weitgehend "as-is" vom Client
// übernommen, weil die komplette Spiellogik (XP/Coins-Berechnung) im Frontend
// läuft. Das ist bewusst pragmatisch, aber KEIN Schutz gegen Cheating — ein
// technisch versierter Nutzer könnte über die DevTools beliebige Werte senden.
// Als Härtung wird zumindest verhindert, dass Coins/XP pro Sync unrealistisch
// stark springen. Für ein wirklich cheat-sicheres System müsste die komplette
// Punkte-/Coin-Vergabe serverseitig neu berechnet werden (separates Vorhaben).
const MAX_COINS_DELTA_PER_SYNC = 2000;
const MAX_XP_DELTA_PER_SYNC = 5000;

const getProgress = asyncHandler(async (req, res) => {
  res.json({ progress: req.user.progress });
});

const saveProgress = asyncHandler(async (req, res) => {
  const incoming = req.body.progress;
  if (!incoming || typeof incoming !== "object") {
    throw new ApiError(400, "progress-Objekt fehlt.");
  }

  const before = req.user.progress;
  const coinsDelta = (incoming.coins ?? before.coins) - before.coins;
  const xpDelta = (incoming.totalCoinsEarned ?? before.totalCoinsEarned) - before.totalCoinsEarned;
  if (coinsDelta > MAX_COINS_DELTA_PER_SYNC || xpDelta > MAX_XP_DELTA_PER_SYNC) {
    throw new ApiError(400, "Unplausibler Fortschrittssprung erkannt.");
  }

  for (const field of ALLOWED_FIELDS) {
    if (incoming[field] !== undefined) {
      req.user.progress[field] = incoming[field];
    }
  }
  req.user.markModified("progress");
  await req.user.save();
  res.json({ progress: req.user.progress });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { avatar } = req.body;
  if (avatar) {
    const owns = req.user.ownedAvatars.includes(avatar);
    const FREE_AVATARS = ["🧑‍💻", "👩‍💻", "🧑‍🚀", "🦊", "🐱", "🐼", "🐧", "🦄", "🐸", "🤖", "🐨", "🦁"];
    if (!owns && !FREE_AVATARS.includes(avatar)) {
      throw new ApiError(403, "Dieser Avatar wurde noch nicht freigeschaltet.");
    }
    req.user.avatar = avatar;
  }
  await req.user.save();
  res.json({ user: req.user });
});

module.exports = { getProgress, saveProgress, updateProfile };
