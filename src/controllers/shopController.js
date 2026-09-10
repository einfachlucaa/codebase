const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const logActivity = require("../utils/logActivity");
const { PREMIUM_AVATARS, GEM_AVATARS, ALL_SHOP_ITEMS } = require("../config/shopItems");

const getShop = asyncHandler(async (req, res) => {
  res.json({
    coinItems: PREMIUM_AVATARS,
    gemItems: GEM_AVATARS,
    owned: req.user.ownedAvatars,
    coins: req.user.progress.coins,
    gems: req.user.progress.gems,
  });
});

const buyAvatar = asyncHandler(async (req, res) => {
  const { avatar } = req.body;
  const item = ALL_SHOP_ITEMS.find((a) => a.avatar === avatar);
  if (!item) throw new ApiError(404, "Dieser Avatar existiert nicht im Shop.");
  if (req.user.ownedAvatars.includes(avatar)) {
    throw new ApiError(409, "Du besitzt diesen Avatar bereits.");
  }
  const balance = item.currency === "gems" ? req.user.progress.gems : req.user.progress.coins;
  if (balance < item.cost) {
    throw new ApiError(402, `Nicht genug ${item.currency === "gems" ? "Gems" : "Coins"}.`);
  }

  if (item.currency === "gems") req.user.progress.gems -= item.cost;
  else req.user.progress.coins -= item.cost;
  req.user.ownedAvatars.push(avatar);
  req.user.markModified("progress");
  await req.user.save();
  logActivity(req.user, "shop_purchase", { item: avatar, cost: item.cost, currency: item.currency });

  res.json({ user: req.user });
});

module.exports = { getShop, buyAvatar };
