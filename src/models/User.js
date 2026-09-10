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
    coins: { type: Number, default: 50 },
    gems: { type: Number, default: 0 }, // seltene Zweitwährung, nicht im Casino einsetzbar
    totalCoinsEarned: { type: Number, default: 50 },
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
    memoryPerfect: { type: Number, default: 0 },
    quizRushBestStreak: { type: Number, default: 0 },
    arcadePlays: { type: Number, default: 0 },
    // Freiform-Zähler pro Spiel ("bubble" -> 3, "tap" -> 1, ...)
    gamesPlayed: { type: mongoose.Schema.Types.Mixed, default: {} },
    daily: {
      date: { type: String, default: null },
      exToday: { type: Number, default: 0 },
      lessonsToday: { type: Number, default: 0 },
      xpToday: { type: Number, default: 0 },
      claimed: { type: Boolean, default: false },
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
    warnings: { type: [WarningSchema], default: [] },
    avatar: { type: String, default: "🧑‍💻" },
    ownedAvatars: { type: [String], default: [] }, // im Shop gekaufte Premium-Avatare
    progress: { type: ProgressSchema, default: () => ({}) },
    lastLoginAt: { type: Date, default: null },

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

module.exports = mongoose.model("User", UserSchema);
