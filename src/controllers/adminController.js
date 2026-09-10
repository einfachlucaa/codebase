const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ROLES, PERMISSIONS } = require("../config/permissions");

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

  const { coins, xp, level } = req.body;
  if (coins !== undefined) user.progress.coins = Math.max(0, Number(coins));
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
  const [totalUsers, bannedUsers, totalCoins] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ banned: true }),
    User.aggregate([{ $group: { _id: null, sum: { $sum: "$progress.coins" } } }]),
  ]);
  res.json({
    totalUsers,
    bannedUsers,
    totalCoinsInEconomy: totalCoins[0]?.sum || 0,
  });
});

module.exports = { listUsers, getUser, editStats, setRole, setPermissions, setBanned, deleteUser, stats };
