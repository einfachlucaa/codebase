const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const Message = require("../models/Message");
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
  if (coins !== undefined) user.progress.coins = Math.max(0, Number(coins));
  if (gems !== undefined) user.progress.gems = Math.max(0, Number(gems));
  if (xp !== undefined) user.progress.xp = Math.max(0, Number(xp));
  if (level !== undefined) user.progress.level = Math.max(1, Number(level));
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

const setPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;
  if (!Array.isArray(permissions) || !permissions.every((p) => Object.values(PERMISSIONS).includes(p))) {
    throw new ApiError(400, "Ungültige Permission-Liste.");
  }
  const user = await User.findByIdAndUpdate(req.params.id, { permissions }, { new: true });
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

const setBanned = asyncHandler(async (req, res) => {
  const { banned, reason } = req.body;
  if (String(req.user._id) === req.params.id) {
    throw new ApiError(400, "Du kannst dich nicht selbst sperren.");
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { banned: !!banned, banReason: banned ? reason || "" : "" },
    { new: true }
  );
  if (!user) throw new ApiError(404, "Nutzer nicht gefunden.");
  logActivity(req.user, banned ? "ban" : "unban", { targetUser: user.username, reason });
  res.json({ user });
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
  listUsers, getUser, editStats, setRole, setPermissions, setBanned, deleteUser, stats,
  warnUser, clearWarnings, clearFlag, listActivity, listUserMessages, resetPicture,
};
