const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../../config/config");
const { ROLES } = require("../config/permissions");

// Spiegelt 1:1 newProgress() aus dem alten client-seitigen state.js,
// damit das Frontend ohne größere Umbauten weiterläuft.
const ProgressSchema = new mongoose.Schema(
  {
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 5 },
    gems: { type: Number, default: 0 }, // seltene Zweitwährung, nicht im Casino einsetzbar
    totalCoinsEarned: { type: Number, default: 5 },
    streak: { type: Number, default: 0 },
    lastLearnDate: { type: String, default: null },
    completedLessons: { type: [String], default: [] },
    completedExercises: { type: [String], default: [] },
    unlocked: { type: [String], default: [] },
    totalSolved: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    bubbleHigh: { type: Number, default: 0 },
    tapHigh: { type: Number, default: 0 },
    memoryHigh: { type: Number, default: 0 },
    quizRushHigh: { type: Number, default: 0 },
    pacmanHigh: { type: Number, default: 0 },
    snakeHigh: { type: Number, default: 0 },
    memoryPerfect: { type: Number, default: 0 },
    quizRushBestStreak: { type: Number, default: 0 },
    arcadePlays: { type: Number, default: 0 },
    // Freiform-Zähler pro Spiel ("bubble" -> 3, "tap" -> 1, ...)
    gamesPlayed: { type: mongoose.Schema.Types.Mixed, default: {} },
    exerciseCooldowns: { type: mongoose.Schema.Types.Mixed, default: {} }, // exId -> Zeitpunkt letzter Belohnung
    lessonCooldowns: { type: mongoose.Schema.Types.Mixed, default: {} },
    examCooldowns: { type: mongoose.Schema.Types.Mixed, default: {} }, // courseId -> Zeitpunkt letzter Klausur
    examsPassed: { type: Number, default: 0 },
    examsPerfect: { type: Number, default: 0 },
    daily: {
      date: { type: String, default: null },
      exToday: { type: Number, default: 0 },
      lessonsToday: { type: Number, default: 0 },
      xpToday: { type: Number, default: 0 },
      claimed: { type: Boolean, default: false },
    },
    // ---- Cookie Clicker ----
    cookieClicker: {
      clickPower: { type: Number, default: 1 },
      autoPerSecond: { type: Number, default: 0 },
      upgrades: { type: mongoose.Schema.Types.Mixed, default: {} },
      lastCollectedAt: { type: Date, default: Date.now },
    },
    // ---- Factory (reines Idle-Spiel) ----
    factory: {
      coinsPerSecond: { type: Number, default: 0 },
      upgrades: { type: mongoose.Schema.Types.Mixed, default: {} },
      lastCollectedAt: { type: Date, default: Date.now },
      prestigeLevel: { type: Number, default: 0 }, // permanenter Produktions-Bonus nach Reset
      autoCollect: { type: Boolean, default: false }, // "Manager": Abholen läuft automatisch mit
    },
  },
  { _id: false }
);

const WarningSchema = new mongoose.Schema(
  { reason: String, byAdmin: String, at: { type: Date, default: Date.now } },
  { _id: false }
);
const FriendRequestSchema = new mongoose.Schema(
  { user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, username: String, at: { type: Date, default: Date.now } },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/, // keine Sonderzeichen -> vermeidet Injection-/Encoding-Ärger
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "user" },
    // Zusätzliche, individuell vergebene Permissions (siehe src/config/permissions.js)
    permissions: { type: [String], default: [] },
    banned: { type: Boolean, default: false },
    banReason: { type: String, default: "" },
    bannedUntil: { type: Date, default: null }, // null = dauerhaft gesperrt (falls banned=true)
    isMuted: { type: Boolean, default: false }, // darf sich einloggen, aber keine Chat-Nachrichten senden
    tokenVersion: { type: Number, default: 0 }, // hochzählen = alle bestehenden Logins dieses Nutzers sofort ungültig ("Kick")
    underReviewBy: { type: String, default: null }, // Username des Admins, der diesen Account gerade im Admin-Panel bearbeitet
    underReviewAt: { type: Date, default: null },   // damit ein vergessen offen gelassenes Bearbeiten-Fenster automatisch abläuft
    warnings: { type: [WarningSchema], default: [] },
    avatar: { type: String, default: "🧑‍💻" },
    profilePicture: { type: String, default: null }, // Base64-Data-URI, serverseitig geprüft (Größe/Format)
    bannerImage: { type: String, default: null },     // Profil-Banner: Base64-Data-URI ODER Template-ID (siehe bannerColor)
    bannerColor: { type: String, default: "#ff7a1a" }, // Hex-Farbe für Farbverlauf-Banner (Color-Picker)
    bio: { type: String, default: "", maxlength: 160 },
    onboarded: { type: Boolean, default: false },   // Pflicht-Profil-Setup nach Registrierung abgeschlossen?
    tutorialSeen: { type: Boolean, default: false }, // Einführungs-Tour schon gesehen?
    favoriteCourse: { type: String, default: null }, // z.B. "csharp" oder "python" — als Badge am Profil
    ownedAvatars: { type: [String], default: [] }, // im Shop gekaufte Premium-Avatare

    // ---- Abo-System (kostet Gems, keine echten Zahlungen) ----
    subscription: {
      tier: { type: String, enum: ["free", "basic", "pro"], default: "free" },
      expiresAt: { type: Date, default: null }, // null = unbegrenzt (nur bei "pro")
    },
    progress: { type: ProgressSchema, default: () => ({}) },
    lastLoginAt: { type: Date, default: null },

    // ---- Ban-Evasion-Schutz ----
    registrationIp: { type: String, default: null },
    lastLoginIp: { type: String, default: null },
    bannedIps: { type: [String], default: [] }, // IPs, die zum Zeitpunkt der Sperre bekannt waren

    // ---- Anti-Cheat / Sicherheit ----
    lastSyncAt: { type: Date, default: null },
    dailyEconomy: {
      date: { type: String, default: null },
      xpGained: { type: Number, default: 0 },
      coinsGained: { type: Number, default: 0 },
      gemsGained: { type: Number, default: 0 },
    },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: "" },

    // ---- Freunde ----
    friends: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    friendRequestsIncoming: { type: [FriendRequestSchema], default: [] },
    friendRequestsOutgoing: { type: [FriendRequestSchema], default: [] },
  },
  { timestamps: true }
);

// Passwort niemals im Klartext ablegen.
// Harte Obergrenze für die Wirtschaft: 10 Millionen bei Coins/Gems/XP.
// Als pre("save")-Hook statt an jeder einzelnen Stelle im Code, damit
// WIRKLICH JEDER Pfad (Admin-Edit, Idle-Games, Casino, Shop, Sync ...)
// automatisch erfasst ist, auch zukünftige. Zusätzlich NaN-Schutz.
const MAX_ECONOMY_VALUE = 10_000_000;
UserSchema.pre("save", function (next) {
  const p = this.progress;
  if (p) {
    const clamp = (v, fallback) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(MAX_ECONOMY_VALUE, Math.max(0, n));
    };
    p.coins = clamp(p.coins, 0);
    p.gems = clamp(p.gems, 0);
    p.xp = clamp(p.xp, 0);
    p.totalCoinsEarned = clamp(p.totalCoinsEarned, 0);
  }
  next();
});

UserSchema.methods.setPassword = async function (plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, config.bcryptSaltRounds);
};
UserSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Berechnet die Gesamt-XP über alle Level hinweg (für Leaderboard-Sortierung).
UserSchema.methods.totalXp = function () {
  const xpForLevel = (level) => 500 + (level - 1) * 250;
  let total = this.progress.xp;
  for (let lv = 1; lv < this.progress.level; lv++) total += xpForLevel(lv);
  return total;
};

// Nie den Passwort-Hash oder interne Mongo-Felder an den Client schicken.
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

// Expliziter Collection-Name (statt Mongoose's automatischer Pluralisierung) —
// sorgt für eine klare, vorhersehbare Struktur in der MongoDB-Datenbank "codebase".
module.exports = mongoose.model("User", UserSchema, "users");
