// Alle Abos werden mit Gems bezahlt, nicht mit echtem Geld.
// "basic" ist ein 24h-Boost (mehrfach nachkaufbar), "pro" ist ein Dauerkauf.
const TIERS = {
  free: {
    label: "Learn Free",
    costGems: 0,
    durationHours: null,
    perks: { productionBoost: 0, dailyBonusBoost: 0, exclusiveAvatar: false },
    description: "Alle Grundfunktionen: Lektionen, Übungen, Arcade, Casino, Shop.",
  },
  basic: {
    label: "Learn Basic",
    costGems: 20,
    durationHours: 24,
    perks: { productionBoost: 0.15, dailyBonusBoost: 0.5, exclusiveAvatar: false },
    description: "+15% Coins aus Cookie-Clicker & Factory, +50% Daily-Bonus. Gilt 24 Stunden.",
  },
  pro: {
    label: "Learn Pro",
    costGems: 80,
    durationHours: null, // dauerhaft
    perks: { productionBoost: 0.4, dailyBonusBoost: 1, exclusiveAvatar: true },
    description: "+40% Coins aus Cookie-Clicker & Factory, doppelter Daily-Bonus, exklusiver Avatar-Rahmen. Dauerhaft.",
  },
};

// Liefert das aktuell GÜLTIGE Abo (abgelaufene "basic"-Abos zählen wieder als "free").
function effectiveTier(user) {
  const sub = user.subscription || { tier: "free", expiresAt: null };
  if (sub.tier === "free") return "free";
  if (sub.tier === "pro") return "pro"; // dauerhaft, kein Ablauf
  if (sub.tier === "basic") {
    if (sub.expiresAt && new Date(sub.expiresAt) > new Date()) return "basic";
    return "free"; // abgelaufen
  }
  return "free";
}

module.exports = { TIERS, effectiveTier };
