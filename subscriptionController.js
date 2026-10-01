const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const logActivity = require("../utils/logActivity");
const { TIERS, effectiveTier } = require("../config/subscriptions");

const getSubscription = asyncHandler(async (req, res) => {
  const tier = effectiveTier(req.user);
  res.json({
    currentTier: tier,
    expiresAt: req.user.subscription.expiresAt,
    gems: req.user.progress.gems,
    tiers: TIERS,
  });
});

const buySubscription = asyncHandler(async (req, res) => {
  const { tier } = req.body;
  const plan = TIERS[tier];
  if (!plan || tier === "free") throw new ApiError(400, "Ungültige Abo-Stufe.");

  if (req.user.progress.gems < plan.costGems) throw new ApiError(402, "Nicht genug Gems.");

  req.user.progress.gems -= plan.costGems;
  req.user.subscription.tier = tier;
  req.user.subscription.expiresAt = plan.durationHours
    ? new Date(Date.now() + plan.durationHours * 60 * 60 * 1000)
    : null;
  req.user.markModified("progress");
  await req.user.save();
  logActivity(req.user, "shop_purchase", { item: `subscription:${tier}`, cost: plan.costGems, currency: "gems" });

  res.json({ user: req.user, currentTier: effectiveTier(req.user) });
});

module.exports = { getSubscription, buySubscription };
