const crypto = require("crypto");
const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const MAX_GROUPS_OWNED = 10; // Schutz gegen Spam-Erstellung
const MAX_CHANNELS_PER_GROUP = 25;
const MAX_MEMBERS_PER_GROUP = 100;

function genInviteCode() {
  return crypto.randomBytes(5).toString("hex"); // 10 Zeichen, URL-sicher
}
function genChannelId() {
  return crypto.randomBytes(4).toString("hex");
}

async function assertMember(groupId, userId) {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Server nicht gefunden.");
  if (!group.members.some((m) => String(m) === String(userId))) {
    throw new ApiError(403, "Du bist kein Mitglied dieses Servers.");
  }
  return group;
}

const createGroup = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, "Name fehlt.");
  const owned = await Group.countDocuments({ owner: req.user._id });
  if (owned >= MAX_GROUPS_OWNED) throw new ApiError(400, `Du kannst maximal ${MAX_GROUPS_OWNED} Server besitzen.`);

  const group = await Group.create({
    name: name.trim().slice(0, 40),
    owner: req.user._id,
    members: [req.user._id],
    channels: [{ id: genChannelId(), name: "allgemein", category: "Text-Channels" }],
    inviteCode: genInviteCode(),
  });
  res.status(201).json({ group });
});

const listMyGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ members: req.user._id }).select("name icon owner members channels inviteCode").lean();
  res.json({ groups });
});

const getGroup = asyncHandler(async (req, res) => {
  const group = await assertMember(req.params.id, req.user._id);
  const members = await User.find({ _id: { $in: group.members } }).select("username avatar").lean();
  res.json({ group, members });
});

const joinGroup = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) throw new ApiError(400, "Einladungscode fehlt.");
  const group = await Group.findOne({ inviteCode: inviteCode.trim() });
  if (!group) throw new ApiError(404, "Ungültiger Einladungscode.");
  if (group.members.some((m) => String(m) === String(req.user._id))) {
    throw new ApiError(409, "Du bist schon Mitglied.");
  }
  if (group.members.length >= MAX_MEMBERS_PER_GROUP) throw new ApiError(400, "Dieser Server ist voll.");
  group.members.push(req.user._id);
  await group.save();
  res.json({ group });
});

const leaveGroup = asyncHandler(async (req, res) => {
  const group = await assertMember(req.params.id, req.user._id);
  if (String(group.owner) === String(req.user._id)) {
    throw new ApiError(400, "Als Besitzer kannst du den Server nicht verlassen — lösch ihn stattdessen.");
  }
  group.members = group.members.filter((m) => String(m) !== String(req.user._id));
  await group.save();
  res.json({ ok: true });
});

const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw new ApiError(404, "Server nicht gefunden.");
  if (String(group.owner) !== String(req.user._id)) throw new ApiError(403, "Nur der Besitzer kann den Server löschen.");
  await GroupMessage.deleteMany({ group: group._id });
  await group.deleteOne();
  res.json({ ok: true });
});

const addChannel = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) throw new ApiError(404, "Server nicht gefunden.");
  if (String(group.owner) !== String(req.user._id)) throw new ApiError(403, "Nur der Besitzer kann Channels anlegen.");
  if (group.channels.length >= MAX_CHANNELS_PER_GROUP) throw new ApiError(400, "Channel-Limit erreicht.");
  const { name, category } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, "Channel-Name fehlt.");
  group.channels.push({ id: genChannelId(), name: name.trim().slice(0, 40), category: (category || "Allgemein").trim().slice(0, 40) });
  await group.save();
  res.json({ group });
});

const listChannelMessages = asyncHandler(async (req, res) => {
  await assertMember(req.params.id, req.user._id);
  const messages = await GroupMessage.find({ group: req.params.id, channelId: req.params.channelId })
    .sort({ createdAt: -1 }).limit(60).lean();
  res.json({ messages: messages.reverse() });
});

const sendChannelMessage = asyncHandler(async (req, res) => {
  if (req.user.isMuted) throw new ApiError(403, "Du wurdest stummgeschaltet und kannst aktuell keine Nachrichten senden.");
  const group = await assertMember(req.params.id, req.user._id);
  if (!group.channels.some((c) => c.id === req.params.channelId)) throw new ApiError(404, "Channel nicht gefunden.");
  const { text } = req.body;
  if (!text || !text.trim()) throw new ApiError(400, "Nachricht ist leer.");
  if (text.length > 1000) throw new ApiError(400, "Nachricht zu lang (max. 1000 Zeichen).");
  const msg = await GroupMessage.create({
    group: group._id, channelId: req.params.channelId,
    from: req.user._id, fromUsername: req.user.username, fromAvatar: req.user.avatar,
    text: text.trim(),
  });
  res.status(201).json({ message: msg });
});

module.exports = {
  createGroup, listMyGroups, getGroup, joinGroup, leaveGroup, deleteGroup,
  addChannel, listChannelMessages, sendChannelMessage,
};
