// Premium-Avatare, die im Shop mit gesammelten Coins gekauft werden können.
// Die "normalen" Avatare (siehe AVATARS in public/js/data.js) bleiben kostenlos.
const PREMIUM_AVATARS = [
  { avatar: "🐲", name: "Drache", cost: 300, currency: "coins" },
  { avatar: "🦖", name: "T-Rex", cost: 300, currency: "coins" },
  { avatar: "🥷", name: "Ninja", cost: 450, currency: "coins" },
  { avatar: "🧙", name: "Zauberer", cost: 450, currency: "coins" },
  { avatar: "👑", name: "König/Königin", cost: 800, currency: "coins" },
  { avatar: "🛸", name: "UFO", cost: 800, currency: "coins" },
];

// Gem-Avatare: seltene Zweitwährung, nicht mit Coins kaufbar und nicht im
// Casino einsetzbar -> bleiben dadurch ein echtes Prestige-Ziel.
const GEM_AVATARS = [
  { avatar: "💎", name: "Diamant", cost: 8, currency: "gems" },
  { avatar: "🌟", name: "Superstar", cost: 12, currency: "gems" },
  { avatar: "🔥", name: "Phönix", cost: 15, currency: "gems" },
  { avatar: "🏆", name: "Champion", cost: 25, currency: "gems" },
];

const ALL_SHOP_ITEMS = [...PREMIUM_AVATARS, ...GEM_AVATARS];

module.exports = { PREMIUM_AVATARS, GEM_AVATARS, ALL_SHOP_ITEMS };
