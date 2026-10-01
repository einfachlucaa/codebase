const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const logActivity = require("../utils/logActivity");

// WICHTIG: Anders als die Arcade-Minispiele läuft das Casino komplett
// serverseitig — Einsatz abziehen, Zufallsergebnis würfeln, Gewinn auszahlen
// passiert alles hier. Der Client kann das Ergebnis nicht beeinflussen.
const MIN_BET = 5;
const MAX_BET = 500; // Cap, damit niemand in einer Runde den ganzen Coin-Vorrat verzockt
const SPIN_COOLDOWN_MS = 800; // verhindert Klick-Spam / Skript-Automatisierung

function checkCooldown(user) {
  if (user.lastSyncAt && Date.now() - user.lastSyncAt.getTime() < SPIN_COOLDOWN_MS) {
    throw new ApiError(429, "Nicht so schnell — kurz warten.");
  }
  user.lastSyncAt = new Date();
}
function validateBet(user, bet) {
  bet = Number(bet);
  if (!Number.isFinite(bet) || bet < MIN_BET || bet > MAX_BET) {
    throw new ApiError(400, `Einsatz muss zwischen ${MIN_BET} und ${MAX_BET} Coins liegen.`);
  }
  if (user.progress.coins < bet) throw new ApiError(402, "Nicht genug Coins.");
  return bet;
}

// 48% Gewinnchance auf Verdopplung -> leichter Hausvorteil, wie in jedem Casino.
const coinflip = asyncHandler(async (req, res) => {
  const user = req.user;
  checkCooldown(user);
  const bet = validateBet(user, req.body.bet);
  const choice = req.body.choice === "tails" ? "tails" : "heads";

  const result = Math.random() < 0.5 ? "heads" : "tails";
  const win = result === choice && Math.random() < 0.96; // kleiner zusätzlicher Hausvorteil
  const payout = win ? bet * 2 : 0;

  user.progress.coins += (payout - bet);
  user.markModified("progress");
  await user.save();
  logActivity(user, "casino_bet", { game: "coinflip", bet, win, payout });

  res.json({ result, win, payout, coins: user.progress.coins });
});

// Einfacher 3-Walzen-Slot mit festen Gewinnchancen/Multiplikatoren.
// Symbol-IDs müssen zu den SVG-Icons im Frontend (public/js/pages.js: casinoIcon) passen.
const SYMBOLS = ["cherry", "lemon", "bell", "star", "diamond"];
const PAYOUTS = { cherry: 2, lemon: 3, bell: 5, star: 10, diamond: 25 };

const slots = asyncHandler(async (req, res) => {
  const user = req.user;
  checkCooldown(user);
  const bet = validateBet(user, req.body.bet);

  const reels = [0, 0, 0].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
  let payout = 0;
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    payout = bet * PAYOUTS[reels[0]];
  } else if (reels[0] === reels[1] || reels[1] === reels[2]) {
    payout = Math.floor(bet * 1.2); // kleiner Trostgewinn bei 2 gleichen Symbolen
  }

  user.progress.coins += (payout - bet);
  user.markModified("progress");
  await user.save();
  logActivity(user, "casino_bet", { game: "slots", bet, reels, payout });

  res.json({ reels, payout, coins: user.progress.coins });
});

// Higher/Lower: eine Karte (1-13) ist vorgegeben, Tipp ob die zweite höher
// oder niedriger ist. Bei Gleichstand wird neu gezogen (kein Unentschieden).
const RANK_NAMES = { 1:"A", 11:"B", 12:"D", 13:"K" };
function rankLabel(n){ return RANK_NAMES[n] || String(n); }

const higherLower = asyncHandler(async (req, res) => {
  const user = req.user;
  checkCooldown(user);
  const bet = validateBet(user, req.body.bet);
  const guess = req.body.guess === "lower" ? "lower" : "higher";

  const card1 = 1 + Math.floor(Math.random() * 13);
  let card2 = 1 + Math.floor(Math.random() * 13);
  while (card2 === card1) card2 = 1 + Math.floor(Math.random() * 13); // kein Unentschieden

  const actuallyHigher = card2 > card1 ? "higher" : "lower";
  const win = actuallyHigher === guess;
  const payout = win ? Math.floor(bet * 1.9) : 0;

  user.progress.coins += (payout - bet);
  user.markModified("progress");
  await user.save();
  logActivity(user, "casino_bet", { game: "higherlower", bet, win, payout, card1, card2 });

  res.json({ card1, card1Label: rankLabel(card1), card2, card2Label: rankLabel(card2), win, payout, coins: user.progress.coins });
});

module.exports = { coinflip, slots, higherLower, MIN_BET, MAX_BET };
