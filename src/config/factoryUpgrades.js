// Reines Idle-Spiel: jeder Generator erhöht coinsPerSecond. Keine Klicks nötig,
// Produktion läuft passiv weiter, auch wenn man offline ist (wird beim nächsten
// "Abholen" komplett serverseitig nachgerechnet -> nicht manipulierbar).
const FACTORY_GENERATORS = [
  { id: "band", name: "Fließband", icon: "🏭", baseCost: 50, cps: 0.5 },
  { id: "roboter", name: "Roboterarm", icon: "🦾", baseCost: 300, cps: 3 },
  { id: "lager", name: "Automatisiertes Lager", icon: "📦", baseCost: 1800, cps: 18 },
  { id: "fabrik", name: "Zweigwerk", icon: "🏗️", baseCost: 9000, cps: 90 },
  { id: "ki_fabrik", name: "KI-gesteuerte Megafabrik", icon: "🌆", baseCost: 50000, cps: 500 },
  { id: "quanten", name: "Quantenfertigung", icon: "🧬", baseCost: 250000, cps: 2600 },
  { id: "orbital", name: "Orbital-Werk", icon: "🛰️", baseCost: 1200000, cps: 12000 },
  { id: "multiversum", name: "Multiversum-Fabrik", icon: "🌌", baseCost: 6000000, cps: 60000 },
];

// "Werksleiter" — ein Manager pro Fabrik, den man einmalig mit Gems anheuert
// und der das Abholen automatisch übernimmt (Komfort-Kauf, keine echte
// Wirtschafts-Auswirkung — die Produktion selbst bleibt exakt gleich).
const FACTORY_MANAGER_COST_GEMS = 15;

// Prestige: setzt Generatoren & coinsPerSecond zurück, gibt dafür einen
// PERMANENTEN Produktions-Bonus (+15% pro Stufe). Braucht eine Mindest-
// Produktion, damit man nicht ohne jeden Fortschritt gleich resettet.
const PRESTIGE_MIN_CPS = 50;
const PRESTIGE_BONUS_PER_LEVEL = 0.15;

function costFor(gen, owned) {
  return Math.ceil(gen.baseCost * Math.pow(1.15, owned));
}

module.exports = { FACTORY_GENERATORS, costFor, FACTORY_MANAGER_COST_GEMS, PRESTIGE_MIN_CPS, PRESTIGE_BONUS_PER_LEVEL };
