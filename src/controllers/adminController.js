const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const Message = require("../models/Message");
const UnbanRequest = require("../models/UnbanRequest");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const logActivity = require("../utils/logActivity");
const { ROLES, PERMISSIONS, AUTO_BAN_AFTER_WARNINGS } = require("../config/permissions");

const listUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  const filter = q ? { username: { $regex: q, $options: "i" } } : {};
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json({ users, permissionList: Object.values(PERMISSIONS), roles: ROLES });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "Nutzer nicht gefunden.");
  res.json({ user });
});

// Admin darf Coins/XP/Level korrigieren (z.B. Support-Fälle, Event-Belohnungen).
const editStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "Nutzer nicht gefunden.");

  const { coins, gems, xp, level } = req.body;
  const num = (v, fallback) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
  if (coins !== undefined) user.progress.coins = Math.max(0, num(coins, user.progress.coins));
  if (gems !== undefined) user.progress.gems = Math.max(0, num(gems, user.progress.gems));
  if (xp !== undefined) user.progress.xp = Math.max(0, num(xp, user.progress.xp));
  if (level !== undefined) user.progress.level = Math.max(1, num(level, user.progress.level));
  user.markModified("progress");
  await user.save();
  res.json({ user });
});

const setRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) throw new ApiError(400, "Ungültige Rolle.");
  if (String(req.user._id) === req.params.id && role !== "admin") {
    throw new ApiError(400, "Du kannst dir selbst nicht die Admin-Rolle entziehen.");
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw new ApiError(404, "Nutzer nicht gefunden.");
  res.json({ user });
});



// Verwarnung erteilen. Nach AUTO_BAN_AFTER_WARNINGS aktiven Verwarnungen
// wird der Account automatisch gesperrt (kein manueller Extra-Schritt nötig).
const warnUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) throw new ApiError(400, "Ein Grund für die Verwarnung ist erforderlich.");
  if (String(req.user._id) === req.params.id) throw new ApiError(400, "Du kannst dich nicht selbst verwarnen.");

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "Nutzer nicht gefunden.");

  user.warnings.push({ reason: reason.trim(), byAdmin: req.user.username });
  let autoBanned = false;
  if (user.warnings.length >= AUTO_BAN_AFTER_WARNINGS && !user.banned) {
    user.banned = true;
    user.banReason = `Automatisch gesperrt nach ${user.warnings.length} Verwarnungen.`;
    const ips = [user.registrationIp, user.lastLoginIp].filter(Boolean);
    user.bannedIps = [...new Set([...user.bannedIps, ...ips])];
    autoBanned = true;
  }
  await user.save();
  logActivity(req.user, "warn", { targetUser: user.username, reason, autoBanned });
  res.json({ user, autoBanned });
});

// Verwarnungen zurücksetzen (z.B. nach Rücksprache/Ablauf einer Frist).
const clearWarnings = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { warnings: [] }, { new: true });
  if (!user) throw new ApiError(404, "Nutzer nicht gefunden.");
  res.json({ user });
});

// Cheat-Flag eines Accounts manuell wieder freigeben (nach Prüfung durch Admin).
const clearFlag = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { flagged: false, flagReason: "" },
    { new: true }
  );
  if (!user) throw new ApiError(404, "Nutzer nicht gefunden.");
  res.json({ user });
});

const listActivity = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.username) filter.username = req.query.username;
  if (req.query.type) filter.type = req.query.type;
  const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ logs });
});

// Moderationszugriff: Nachrichten eines Nutzers einsehen (z.B. nach einer Meldung).
// Bewusst nur über explizite Permission (messages.view), nicht für jeden Admin automatisch.
const listUserMessages = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("username");
  if (!user) throw new ApiError(404, "Nutzer nicht gefunden.");
  const messages = await Message.find({ $or: [{ from: user._id }, { to: user._id }] })
    .sort({ createdAt: -1 }).limit(300).lean();
  res.json({ username: user.username, messages });
});

const resetPicture = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { profilePicture: null }, { new: true });
  if (!user) throw new ApiError(404, "Nutzer nicht gefunden.");
  logActivity(req.user, "role_change", { targetUser: user.username, action: "profile_picture_reset" });
  res.json({ user });
});

// Vollständiges Bearbeiten eines einzelnen Nutzers aus dem Admin-Panel heraus
// (ein Speichern-Klick für alle gängigen Felder statt vieler Einzel-Requests).
const fullUpdate = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "Nutzer nicht gefunden.");
  const isSelf = String(req.user._id) === req.params.id;
  const b = req.body;

  const num = (v, fallback) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
  if (b.coins !== undefined) user.progress.coins = Math.max(0, num(b.coins, user.progress.coins));
  if (b.gems !== undefined) user.progress.gems = Math.max(0, num(b.gems, user.progress.gems));
  if (b.xp !== undefined) user.progress.xp = Math.max(0, num(b.xp, user.progress.xp));
  if (b.level !== undefined) user.progress.level = Math.max(1, num(b.level, user.progress.level));
  if (b.avatar !== undefined) user.avatar = String(b.avatar).slice(0, 8);
  if (b.bio !== undefined) user.bio = String(b.bio).slice(0, 160);
  if (b.role !== undefined && ROLES.includes(b.role) && !(isSelf && b.role !== "admin")) user.role = b.role;
  if (b.subscriptionTier !== undefined && ["free", "basic", "pro"].includes(b.subscriptionTier)) {
    user.subscription.tier = b.subscriptionTier;
    if (b.subscriptionTier === "free") user.subscription.expiresAt = null;
  }
  if (b.banned !== undefined && !isSelf) {
    user.banned = !!b.banned;
    user.banReason = b.banned ? (b.banReason || user.banReason || "") : "";
    user.bannedUntil = b.banned && b.banDurationHours ? new Date(Date.now() + Number(b.banDurationHours) * 60 * 60 * 1000) : null;
    if (b.banned) {
      const ips = [user.registrationIp, user.lastLoginIp].filter(Boolean);
      user.bannedIps = [...new Set([...user.bannedIps, ...ips])];
    } else {
      user.bannedIps = [];
    }
  }

  user.markModified("progress");
  await user.save();
  logActivity(req.user, "role_change", { targetUser: user.username, action: "full_edit" });
  res.json({ user });
});

/* ---------- ENTSPERRUNGS-ANFRAGEN ---------- */
const listUnbanRequests = asyncHandler(async (req, res) => {
  const requests = await UnbanRequest.find({ status: "pending" }).sort({ createdAt: -1 }).lean();
  res.json({ requests });
});

const reviewUnbanRequest = asyncHandler(async (req, res) => {
  const { approve } = req.body;
  const reqDoc = await UnbanRequest.findById(req.params.id);
  if (!reqDoc || reqDoc.status !== "pending") throw new ApiError(404, "Anfrage nicht gefunden oder bereits bearbeitet.");

  reqDoc.status = approve ? "approved" : "denied";
  reqDoc.reviewedBy = req.user.username;
  reqDoc.reviewedAt = new Date();
  await reqDoc.save();

  if (approve) {
    const user = await User.findById(reqDoc.user);
    if (user) {
      user.banned = false; user.banReason = ""; user.bannedIps = []; user.warnings = [];
      await user.save();
      logActivity(req.user, "unban", { targetUser: user.username, viaRequest: true });
    }
  }
  res.json({ ok: true });
});

const setBanned = asyncHandler(async (req, res) => {
  const { banned, reason, durationHours } = req.body;
  if (String(req.user._id) === req.params.id) {
    throw new ApiError(400, "Du kannst dich nicht selbst sperren.");
  }
  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, "Nutzer nicht gefunden.");

  target.banned = !!banned;
  target.banReason = banned ? reason || "" : "";
  target.bannedUntil = banned && durationHours ? new Date(Date.now() + Number(durationHours) * 60 * 60 * 1000) : null;
  if (banned) {
    // Bekannte IPs merken, damit eine Neuregistrierung von dort blockiert wird.
    const ips = [target.registrationIp, target.lastLoginIp].filter(Boolean);
    target.bannedIps = [...new Set([...target.bannedIps, ...ips])];
  } else {
    target.bannedIps = []; // Entsperrung hebt auch die IP-Blockade auf
  }
  await target.save();
  logActivity(req.user, banned ? "ban" : "unban", { targetUser: target.username, reason, durationHours });
  res.json({ user: target });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) {
    throw new ApiError(400, "Du kannst dein eigenes Konto hier nicht löschen.");
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, "Nutzer nicht gefunden.");
  res.json({ ok: true });
});

const stats = asyncHandler(async (req, res) => {
  const [totalUsers, bannedUsers, flaggedUsers, totalCoins] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ banned: true }),
    User.countDocuments({ flagged: true }),
    User.aggregate([{ $group: { _id: null, sum: { $sum: "$progress.coins" } } }]),
  ]);
  res.json({
    totalUsers,
    bannedUsers,
    flaggedUsers,
    totalCoinsInEconomy: totalCoins[0]?.sum || 0,
  });
});

module.exports = {
  listUsers, getUser, editStats, setRole, setBanned, deleteUser, stats,
  warnUser, clearWarnings, clearFlag, listActivity, listUserMessages, resetPicture,
  fullUpdate, listUnbanRequests, reviewUnbanRequest,
};
