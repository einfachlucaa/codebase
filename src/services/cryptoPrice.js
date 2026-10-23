// Server-seitiger Live-Kurs-Dienst für das Krypto-Handelsspiel.
// WARUM SERVERSEITIG: Ein einzelner, gemeinsamer Cache für alle Nutzer statt
// dass jeder Browser einzeln die externe API aufruft — schont das Rate-Limit
// von CoinGecko UND verhindert, dass ein Nutzer sich über die Entwicklertools
// einen für ihn günstigeren "Kurs" ausdenkt (der Preis kommt nie vom Client).
//
// FALLBACK: Ist die externe API (CoinGecko, kostenlos & ohne API-Key) gerade
// nicht erreichbar, rechnet der Dienst stattdessen mit einem simulierten
// Random-Walk auf Basis des letzten bekannten Kurses weiter — das Spiel bricht
// dadurch nie komplett ab, auch wenn die Außen-API mal down oder rate-limited ist.

const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
const FETCH_INTERVAL_MS = 15000; // alle 15s neu holen, dazwischen aus dem Cache bedienen
const MAX_HISTORY = 120; // ca. 30 Minuten bei 15s-Takt

let cache = {
  price: 65000, // realistischer Startwert, wird beim ersten echten Fetch sofort überschrieben
  history: [{ t: Date.now(), p: 65000 }],
  lastFetchAt: 0,
  live: false, // true, sobald mindestens einmal echte Daten geholt wurden
};

async function fetchRealPrice() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(COINGECKO_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error("CoinGecko antwortete mit " + res.status);
    const data = await res.json();
    const price = data && data.bitcoin && data.bitcoin.usd;
    if (typeof price !== "number" || !Number.isFinite(price)) throw new Error("Unerwartetes API-Format");
    return price;
  } finally {
    clearTimeout(timeout);
  }
}

function simulateNextPrice(lastPrice) {
  // Kleiner, realistisch wirkender Zufalls-Schritt (~±0.3% pro Tick) als
  // Fallback, falls die echte API gerade nicht erreichbar ist.
  const changePct = (Math.random() - 0.5) * 0.006;
  return Math.max(1, lastPrice * (1 + changePct));
}

async function getCurrentPrice() {
  const now = Date.now();
  if (now - cache.lastFetchAt < FETCH_INTERVAL_MS) return cache;

  let nextPrice;
  try {
    nextPrice = await fetchRealPrice();
    cache.live = true;
  } catch {
    // Fallback: simulierter Schritt statt hartem Fehler
    nextPrice = simulateNextPrice(cache.price);
  }

  cache.price = nextPrice;
  cache.lastFetchAt = now;
  cache.history.push({ t: now, p: nextPrice });
  if (cache.history.length > MAX_HISTORY) cache.history.shift();
  return cache;
}

module.exports = { getCurrentPrice };
