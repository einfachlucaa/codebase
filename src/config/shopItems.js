// Premium-Avatare, die im Shop mit gesammelten Coins gekauft werden können.
// Die "normalen" Avatare (siehe AVATARS in public/js/data.js) bleiben kostenlos.
const PREMIUM_AVATARS = [
  { avatar: "🐲", name: "Drache", cost: 300 },
  { avatar: "🦖", name: "T-Rex", cost: 300 },
  { avatar: "🥷", name: "Ninja", cost: 450 },
  { avatar: "🧙", name: "Zauberer", cost: 450 },
  { avatar: "👑", name: "König/Königin", cost: 800 },
  { avatar: "🛸", name: "UFO", cost: 800 },
  { avatar: "💎", name: "Diamant", cost: 1200 },
  { avatar: "🌟", name: "Superstar", cost: 1500 },
];

module.exports = { PREMIUM_AVATARS };
