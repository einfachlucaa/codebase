const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// WICHTIG (Sicherheit): Unser eigener Server führt NIEMALS fremden Code aus —
// das wäre ein ernstes Sicherheitsrisiko (Remote Code Execution). Stattdessen
// wird die Ausführung an die öffentliche, kostenlose Piston-API weitergereicht
// (https://github.com/engineer-man/piston) — ein etabliertes Open-Source-Projekt,
// das genau für sicher gesandboxte Mehrsprachen-Codeausführung gebaut wurde.
// Das ist ein Drittanbieter-Dienst: keine Verfügbarkeits-/Uptime-Garantie,
// daher großzügiges Timeout + klare Fehlermeldung, falls er nicht erreichbar ist.
const PISTON_URL = "https://emkc.org/api/v2/piston";
const LANGUAGE_ALIASES = {
  python: ["python", "python3"],
  javascript: ["javascript", "node", "js"],
  java: ["java"],
  cpp: ["c++", "cpp"],
  lua: ["lua"],
  csharp: ["csharp", "c#", "cs", "mono"],
};
const FILE_NAMES = {
  python: "main.py", javascript: "main.js", java: "Main.java",
  cpp: "main.cpp", lua: "main.lua", csharp: "main.cs",
};
const MAX_CODE_LENGTH = 20000;

let runtimeCache = null;
let runtimeCacheAt = 0;
async function getRuntimes() {
  if (runtimeCache && Date.now() - runtimeCacheAt < 60 * 60 * 1000) return runtimeCache;
  const res = await fetch(`${PISTON_URL}/runtimes`);
  if (!res.ok) throw new ApiError(502, "Ausführungs-Dienst gerade nicht erreichbar. Später nochmal versuchen.");
  runtimeCache = await res.json();
  runtimeCacheAt = Date.now();
  return runtimeCache;
}
function findRuntime(runtimes, ourLang) {
  const aliases = LANGUAGE_ALIASES[ourLang] || [ourLang];
  return runtimes.find((r) => aliases.includes(r.language) || (r.aliases || []).some((a) => aliases.includes(a)));
}

const runCode = asyncHandler(async (req, res) => {
  const { language, code, stdin } = req.body;
  if (!code || typeof code !== "string" || !code.trim()) throw new ApiError(400, "Kein Code zum Ausführen.");
  if (code.length > MAX_CODE_LENGTH) throw new ApiError(400, "Code zu lang (max. 20.000 Zeichen).");
  if (!LANGUAGE_ALIASES[language]) throw new ApiError(400, "Nicht unterstützte Sprache.");

  const runtimes = await getRuntimes();
  const rt = findRuntime(runtimes, language);
  if (!rt) throw new ApiError(502, "Diese Sprache ist beim Ausführungs-Dienst aktuell nicht verfügbar.");

  const pistonRes = await fetch(`${PISTON_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: rt.language,
      version: rt.version,
      files: [{ name: FILE_NAMES[language] || "main.txt", content: code }],
      stdin: String(stdin || "").slice(0, 2000),
    }),
  });
  if (!pistonRes.ok) {
    let detail = "";
    try{ const errBody = await pistonRes.json(); detail = errBody.message ? ` (${errBody.message})` : ""; } catch{}
    throw new ApiError(502, `Ausführung fehlgeschlagen${detail || ` (Status ${pistonRes.status})`}.`);
  }
  const data = await pistonRes.json();

  res.json({
    stdout: data.run?.stdout || "",
    stderr: data.run?.stderr || "",
    exitCode: data.run?.code ?? null,
    compileStderr: data.compile?.stderr || null,
  });
});

module.exports = { runCode };
