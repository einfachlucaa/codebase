const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const logActivity = require("../utils/logActivity");

const PUBLIC_FIELDS = "username avatar progress.level progress.xp";

const searchUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.json({ users: [] });
  const users = await User.find({
    username: { $regex: q, $options: "i" },
    _id: { $ne: req.user._id },
    banned: false,
  }).select(PUBLIC_FIELDS).limit(15);
  res.json({ users });
});

const listFriends = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("friends", PUBLIC_FIELDS)
    .populate("friendRequestsIncoming.user", PUBLIC_FIELDS)
    .populate("friendRequestsOutgoing.user", PUBLIC_FIELDS);
  res.json({
    friends: user.friends,
    incoming: user.friendRequestsIncoming,
    outgoing: user.friendRequestsOutgoing,
  });
});

const sendRequest = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  if (targetId === String(req.user._id)) throw new ApiError(400, "Du kannst dir nicht selbst eine Anfrage schicken.");

  const target = await User.findById(targetId);
  if (!target) throw new ApiError(404, "Nutzer nicht gefunden.");

  const me = req.user;
  if (me.friends.includes(target._id)) throw new ApiError(409, "Ihr seid bereits befreundet.");
  if (me.friendRequestsOutgoing.some((r) => String(r.user) === targetId)) {
    throw new ApiError(409, "Anfrage bereits gesendet.");
  }

  me.friendRequestsOutgoing.push({ user: target._id, username: target.username });
  target.friendRequestsIncoming.push({ user: me._id, username: me.username });
  await Promise.all([me.save(), target.save()]);
  logActivity(me, "friend_request", { to: target.username });
  res.json({ ok: true });
});

const respondRequest = asyncHandler(async (req, res) => {
  const fromId = req.params.id;
  const { accept } = req.body;
  const me = req.user;
  const other = await User.findById(fromId);
  if (!other) throw new ApiError(404, "Nutzer nicht gefunden.");

  me.friendRequestsIncoming = me.friendRequestsIncoming.filter((r) => String(r.user) !== fromId);
  other.friendRequestsOutgoing = other.friendRequestsOutgoing.filter((r) => String(r.user) !== String(me._id));

  if (accept) {
    if (!me.friends.includes(other._id)) me.friends.push(other._id);
    if (!other.friends.includes(me._id)) other.friends.push(me._id);
    logActivity(me, "friend_accept", { with: other.username });
  }
  await Promise.all([me.save(), other.save()]);
  res.json({ ok: true });
});

const removeFriend = asyncHandler(async (req, res) => {
  const otherId = req.params.id;
  const me = req.user;
  const other = await User.findById(otherId);
  if (!other) throw new ApiError(404, "Nutzer nicht gefunden.");

  me.friends = me.friends.filter((f) => String(f) !== otherId);
  other.friends = other.friends.filter((f) => String(f) !== String(me._id));
  await Promise.all([me.save(), other.save()]);
  res.json({ ok: true });
});

module.exports = { searchUsers, listFriends, sendRequest, respondRequest, removeFriend };
