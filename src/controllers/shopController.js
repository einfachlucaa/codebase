const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { PREMIUM_AVATARS } = require("../config/shopItems");

const getShop = asyncHandler(async (req, res) => {
  res.json({
    items: PREMIUM_AVATARS,
    owned: req.user.ownedAvatars,
    coins: req.user.progress.coins,
  });
});

const buyAvatar = asyncHandler(async (req, res) => {
  const { avatar } = req.body;
  const item = PREMIUM_AVATARS.find((a) => a.avatar === avatar);
  if (!item) throw new ApiError(404, "Dieser Avatar existiert nicht im Shop.");
  if (req.user.ownedAvatars.includes(avatar)) {
    throw new ApiError(409, "Du besitzt diesen Avatar bereits.");
  }
  if (req.user.progress.coins < item.cost) {
    throw new ApiError(402, "Nicht genug Coins.");
  }

  req.user.progress.coins -= item.cost;
  req.user.ownedAvatars.push(avatar);
  req.user.markModified("progress");
  await req.user.save();

  res.json({ user: req.user });
});

module.exports = { getShop, buyAvatar };
