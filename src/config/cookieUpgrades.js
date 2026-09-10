// Klassisches Idle-/Clicker-Schema: jedes Upgrade erhöht Klick-Power ODER
// Auto-Produktion pro Sekunde. Kosten steigen mit jedem Kauf exponentiell
// (1.15er-Faktor, wie in Cookie Clicker / AdVenture Capitalist & Co).
const COOKIE_UPGRADES = [
  { id: "finger", name: "Schnellerer Finger", icon: "👆", baseCost: 15, effect: { clickPower: 1 } },
  { id: "mouse", name: "Turbo-Maus", icon: "🖱️", baseCost: 100, effect: { clickPower: 4 } },
  { id: "intern", name: "Praktikant", icon: "🧑‍💼", baseCost: 60, effect: { autoPerSecond: 1 } },
  { id: "script", name: "Auto-Skript", icon: "⚙️", baseCost: 400, effect: { autoPerSecond: 6 } },
  { id: "server", name: "Serverfarm", icon: "🖥️", baseCost: 2500, effect: { autoPerSecond: 35 } },
  { id: "ai", name: "KI-Assistent", icon: "🤖", baseCost: 15000, effect: { autoPerSecond: 200, clickPower: 10 } },
];

function costFor(upgrade, owned) {
  return Math.ceil(upgrade.baseCost * Math.pow(1.15, owned));
}

module.exports = { COOKIE_UPGRADES, costFor };
