const User = require("../models/User");
const Message = require("../models/Message");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { STICKERS } = require("../config/stickers");

// Sicherheit: keine Links in Nachrichten (Phishing-/Spam-Schutz in einem Chat
// zwischen minderjährigen Nutzern). Wird ersetzt statt die Nachricht abzulehnen,
// damit normale Unterhaltungen nicht kaputtgehen.
const LINK_REGEX = /(https?:\/\/|www\.)[^\s]+/gi;
function sanitizeText(text) {
  return String(text || "").slice(0, 500).replace(LINK_REGEX, "[Link entfernt]");
}

async function assertFriends(meId, otherId) {
  const me = await User.findById(meId).select("friends");
  if (!me.friends.some((f) => String(f) === String(otherId))) {
    throw new ApiError(403, "Ihr müsst befreundet sein, um euch zu schreiben.");
  }
}

const getStickers = asyncHandler(async (req, res) => {
  res.json({ stickers: STICKERS });
});

const getConversation = asyncHandler(async (req, res) => {
  const otherId = req.params.id;
  await assertFriends(req.user._id, otherId);

  const messages = await Message.find({
    $or: [
      { from: req.user._id, to: otherId },
      { from: otherId, to: req.user._id },
    ],
  }).sort({ createdAt: 1 }).limit(200).lean();

  await Message.updateMany({ from: otherId, to: req.user._id, read: false }, { read: true });

  res.json({ messages });
});

const sendMessage = asyncHandler(async (req, res) => {
  const otherId = req.params.id;
  if (otherId === String(req.user._id)) throw new ApiError(400, "Du kannst dir nicht selbst schreiben.");
  await assertFriends(req.user._id, otherId);

  const other = await User.findById(otherId).select("username banned");
  if (!other) throw new ApiError(404, "Nutzer nicht gefunden.");
  if (other.banned) throw new ApiError(403, "Dieser Nutzer ist gesperrt.");

  const text = sanitizeText(req.body.text);
  const stickerId = req.body.sticker || null;
  if (stickerId && !STICKERS.some((s) => s.id === stickerId)) throw new ApiError(400, "Unbekannter Sticker.");
  if (!text.trim() && !stickerId) throw new ApiError(400, "Nachricht ist leer.");

  const msg = await Message.create({
    from: req.user._id, to: otherId,
    fromUsername: req.user.username, toUsername: other.username,
    text: text.trim(), sticker: stickerId,
  });
  res.status(201).json({ message: msg });
});

// Ungelesene Nachrichten pro Freund zählen, für Badge-Anzeige im Frontend.
const getUnreadCounts = asyncHandler(async (req, res) => {
  const unread = await Message.aggregate([
    { $match: { to: req.user._id, read: false } },
    { $group: { _id: "$from", count: { $sum: 1 } } },
  ]);
  res.json({ unread: unread.map((u) => ({ from: u._id, count: u.count })) });
});

module.exports = { getStickers, getConversation, sendMessage, getUnreadCounts };
