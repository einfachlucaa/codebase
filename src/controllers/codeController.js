const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// HINWEIS: Früher lief die Ausführung über die öffentliche Piston-API.
// Diese ist seit Februar 2026 nicht mehr frei zugänglich (Whitelist-only,
// siehe https://github.com/engineer-man/piston#public-api). Eine eigene
// Server-Ausführung bauen wir bewusst nicht (echtes RCE-Sicherheitsrisiko).
// JavaScript und Python laufen deshalb jetzt komplett im Browser
// (sandboxed iframe bzw. Pyodide/WebAssembly) — dieser Endpunkt wird
// dafür nicht mehr gebraucht. Für Java/C++/Lua/C# bräuchte es einen
// eigenen, ggf. kostenpflichtigen Ausführungs-Dienst (z.B. Judge0 via
// RapidAPI) mit eigenem API-Key.
const runCode = asyncHandler(async (req, res) => {
  throw new ApiError(
    501,
    "Server-seitige Code-Ausführung ist aktuell nicht verfügbar (der bisherige kostenlose Dienst wurde eingestellt). JavaScript und Python laufen direkt im Browser."
  );
});

module.exports = { runCode };
