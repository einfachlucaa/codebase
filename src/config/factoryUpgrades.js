// Reines Idle-Spiel: jeder Generator erhöht coinsPerSecond. Keine Klicks nötig,
// Produktion läuft passiv weiter, auch wenn man offline ist (wird beim nächsten
// "Abholen" komplett serverseitig nachgerechnet -> nicht manipulierbar).
const FACTORY_GENERATORS = [
  { id: "band", name: "Fließband", icon: "🏭", baseCost: 50, cps: 0.5 },
  { id: "roboter", name: "Roboterarm", icon: "🦾", baseCost: 300, cps: 3 },
  { id: "lager", name: "Automatisiertes Lager", icon: "📦", baseCost: 1800, cps: 18 },
  { id: "fabrik", name: "Zweigwerk", icon: "🏗️", baseCost: 9000, cps: 90 },
  { id: "ki_fabrik", name: "KI-gesteuerte Megafabrik", icon: "🌆", baseCost: 50000, cps: 500 },
];

function costFor(gen, owned) {
  return Math.ceil(gen.baseCost * Math.pow(1.15, owned));
}

module.exports = { FACTORY_GENERATORS, costFor };
