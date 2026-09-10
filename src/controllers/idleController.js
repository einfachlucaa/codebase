const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { COOKIE_UPGRADES, costFor: cookieCost } = require("../config/cookieUpgrades");
const { FACTORY_GENERATORS, costFor: factoryCost } = require("../config/factoryUpgrades");
const { effectiveTier, TIERS } = require("../config/subscriptions");

// WICHTIG (Sicherheit): Anders als die Arcade-Minispiele meldet der Client hier
// NIE eine fertige Coin-Summe. Er sagt dem Server nur "ich möchte abholen"
// (bzw. bei Cookie Clicker zusätzlich "so oft wurde seit dem letzten Sync
// geklickt"), und der SERVER berechnet die Auszahlung komplett selbst aus
// vergangener Zeit × bekannter Produktionsrate. Damit ist es unmöglich, sich
// über die DevTools/Konsole beliebige Coins zu erschleichen.
const MAX_CLICKS_PER_SECOND = 12; // großzügig für sehr schnelles Klicken, aber Skript-Spam wird gekappt
const MAX_OFFLINE_SECONDS = 60 * 60 * 12; // Produktion läuft max. 12h "offline" weiter, kein unendliches Horten

function productionMultiplier(user) {
  const tier = effectiveTier(user);
  return 1 + TIERS[tier].perks.productionBoost;
}

/* ---------------- COOKIE CLICKER ---------------- */

const getCookieState = asyncHandler(async (req, res) => {
  const c = req.user.progress.cookieClicker;
  res.json({
    clickPower: c.clickPower,
    autoPerSecond: c.autoPerSecond,
    upgrades: c.upgrades,
    catalog: COOKIE_UPGRADES.map((u) => ({ ...u, cost: cookieCost(u, c.upgrades[u.id] || 0), owned: c.upgrades[u.id] || 0 })),
    multiplier: productionMultiplier(req.user),
  });
});

const collectCookie = asyncHandler(async (req, res) => {
  const user = req.user;
  const c = user.progress.cookieClicker;
  const now = Date.now();
  const elapsedSec = Math.min(MAX_OFFLINE_SECONDS, Math.max(0, (now - new Date(c.lastCollectedAt).getTime()) / 1000));

  const claimedClicks = Math.max(0, Math.floor(Number(req.body.clicks) || 0));
  const maxPlausibleClicks = Math.ceil(elapsedSec * MAX_CLICKS_PER_SECOND) + 5; // +5 Puffer für Netzwerk-Jitter
  const acceptedClicks = Math.min(claimedClicks, maxPlausibleClicks);

  const mult = productionMultiplier(user);
  const clickEarnings = Math.floor(acceptedClicks * c.clickPower * mult);
  const autoEarnings = Math.floor(elapsedSec * c.autoPerSecond * mult);
  const earned = clickEarnings + autoEarnings;

  user.progress.coins += earned;
  user.progress.totalCoinsEarned += earned;
  c.lastCollectedAt = now;
  user.markModified("progress");
  await user.save();

  res.json({ earned, coins: user.progress.coins, acceptedClicks });
});

const buyCookieUpgrade = asyncHandler(async (req, res) => {
  const user = req.user;
  const c = user.progress.cookieClicker;
  const upgrade = COOKIE_UPGRADES.find((u) => u.id === req.body.upgradeId);
  if (!upgrade) throw new ApiError(404, "Unbekanntes Upgrade.");

  const owned = c.upgrades[upgrade.id] || 0;
  const cost = cookieCost(upgrade, owned);
  if (user.progress.coins < cost) throw new ApiError(402, "Nicht genug Coins.");

  user.progress.coins -= cost;
  c.upgrades[upgrade.id] = owned + 1;
  if (upgrade.effect.clickPower) c.clickPower += upgrade.effect.clickPower;
  if (upgrade.effect.autoPerSecond) c.autoPerSecond += upgrade.effect.autoPerSecond;
  user.markModified("progress");
  await user.save();

  res.json({ coins: user.progress.coins, clickPower: c.clickPower, autoPerSecond: c.autoPerSecond });
});

/* ---------------- FACTORY (reines Idle-Spiel) ---------------- */

const getFactoryState = asyncHandler(async (req, res) => {
  const f = req.user.progress.factory;
  const now = Date.now();
  const elapsedSec = Math.min(MAX_OFFLINE_SECONDS, Math.max(0, (now - new Date(f.lastCollectedAt).getTime()) / 1000));
  const pending = Math.floor(elapsedSec * f.coinsPerSecond * productionMultiplier(req.user));
  res.json({
    coinsPerSecond: f.coinsPerSecond,
    upgrades: f.upgrades,
    pending,
    catalog: FACTORY_GENERATORS.map((g) => ({ ...g, cost: factoryCost(g, f.upgrades[g.id] || 0), owned: f.upgrades[g.id] || 0 })),
    multiplier: productionMultiplier(req.user),
  });
});

const collectFactory = asyncHandler(async (req, res) => {
  const user = req.user;
  const f = user.progress.factory;
  const now = Date.now();
  const elapsedSec = Math.min(MAX_OFFLINE_SECONDS, Math.max(0, (now - new Date(f.lastCollectedAt).getTime()) / 1000));
  const earned = Math.floor(elapsedSec * f.coinsPerSecond * productionMultiplier(user));

  user.progress.coins += earned;
  user.progress.totalCoinsEarned += earned;
  f.lastCollectedAt = now;
  user.markModified("progress");
  await user.save();

  res.json({ earned, coins: user.progress.coins });
});

const buyFactoryGenerator = asyncHandler(async (req, res) => {
  const user = req.user;
  const f = user.progress.factory;
  const gen = FACTORY_GENERATORS.find((g) => g.id === req.body.generatorId);
  if (!gen) throw new ApiError(404, "Unbekannter Generator.");

  const owned = f.upgrades[gen.id] || 0;
  const cost = factoryCost(gen, owned);
  if (user.progress.coins < cost) throw new ApiError(402, "Nicht genug Coins.");

  user.progress.coins -= cost;
  f.upgrades[gen.id] = owned + 1;
  f.coinsPerSecond += gen.cps;
  user.markModified("progress");
  await user.save();

  res.json({ coins: user.progress.coins, coinsPerSecond: f.coinsPerSecond });
});

module.exports = {
  getCookieState, collectCookie, buyCookieUpgrade,
  getFactoryState, collectFactory, buyFactoryGenerator,
};
