const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { getCurrentPrice } = require("../services/cryptoPrice");

const MAX_HISTORY_KEPT = 30;
const RESET_COOLDOWN_MS = 24 * 60 * 60 * 1000; // ein Reset pro Tag, falls man pleite ist

function pnlFor(position, currentPrice) {
  const changePct = (currentPrice - position.entryPrice) / position.entryPrice;
  const directional = position.side === "buy" ? changePct : -changePct;
  return position.size * directional;
}

const getState = asyncHandler(async (req, res) => {
  const cache = await getCurrentPrice();
  const c = req.user.progress.crypto;
  const openPosition = c.position
    ? { ...c.position, unrealizedPnl: Math.round(pnlFor(c.position, cache.price) * 100) / 100 }
    : null;
  res.json({
    balance: c.balance,
    position: openPosition,
    history: (c.history || []).slice(-15).reverse(),
    price: cache.price,
    priceHistory: cache.history,
    live: cache.live,
    canReset: c.balance < 10 && !c.position && (!c.lastResetAt || Date.now() - new Date(c.lastResetAt).getTime() > RESET_COOLDOWN_MS),
  });
});

const openPosition = asyncHandler(async (req, res) => {
  const user = req.user;
  const c = user.progress.crypto;
  if (c.position) throw new ApiError(409, "Du hast schon eine offene Position — erst schließen.");
  const { side, amount } = req.body;
  if (side !== "buy" && side !== "sell") throw new ApiError(400, "side muss 'buy' oder 'sell' sein.");
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) throw new ApiError(400, "Ungültiger Betrag.");
  if (amt > c.balance) throw new ApiError(402, "Nicht genug Guthaben.");

  const cache = await getCurrentPrice();
  c.balance -= amt;
  c.position = { side, entryPrice: cache.price, size: amt, openedAt: new Date() };
  user.markModified("progress");
  await user.save();
  res.json({ balance: c.balance, position: c.position, price: cache.price });
});

const closePosition = asyncHandler(async (req, res) => {
  const user = req.user;
  const c = user.progress.crypto;
  if (!c.position) throw new ApiError(400, "Keine offene Position.");

  const cache = await getCurrentPrice();
  const pnl = pnlFor(c.position, cache.price);
  // Verlust kann maximal den eingesetzten Betrag kosten (kein Minus-Guthaben,
  // genau wie bei echten Spot-Trades ohne Hebel).
  const clampedPnl = Math.max(-c.position.size, pnl);
  const payout = c.position.size + clampedPnl;
  c.balance += payout;

  c.history = c.history || [];
  c.history.push({
    side: c.position.side, entryPrice: c.position.entryPrice, exitPrice: cache.price,
    size: c.position.size, pnl: Math.round(clampedPnl * 100) / 100, closedAt: new Date(),
  });
  if (c.history.length > MAX_HISTORY_KEPT) c.history = c.history.slice(-MAX_HISTORY_KEPT);
  c.position = null;
  user.markModified("progress");
  await user.save();
  res.json({ balance: c.balance, pnl: clampedPnl, price: cache.price });
});

// Ein Reset pro Tag, aber NUR wenn man wirklich (fast) pleite ist und keine
// offene Position hat — kein Weg, sich einfach bei Verlust neues Guthaben zu holen.
const resetBalance = asyncHandler(async (req, res) => {
  const user = req.user;
  const c = user.progress.crypto;
  if (c.position) throw new ApiError(400, "Erst die offene Position schließen.");
  if (c.balance >= 10) throw new ApiError(400, "Reset ist erst bei (fast) leerem Guthaben möglich.");
  if (c.lastResetAt && Date.now() - new Date(c.lastResetAt).getTime() < RESET_COOLDOWN_MS) {
    throw new ApiError(429, "Reset ist nur einmal pro Tag möglich.");
  }
  c.balance = 5000;
  c.lastResetAt = new Date();
  user.markModified("progress");
  await user.save();
  res.json({ balance: c.balance });
});

module.exports = { getState, openPosition, closePosition, resetBalance };
