const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const config = require("./config/config");
const connectDB = require("./config/db");
const apiRouter = require("./src/routes");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");

async function main() {
  await connectDB();

  const app = express();

  // Render (und die meisten Hoster) laufen hinter einem Reverse-Proxy.
  // Ohne "trust proxy" würde req.ip immer die interne Proxy-IP liefern,
  // wodurch die Ban-Evasion-Erkennung (siehe authController) nutzlos wäre.
  app.set("trust proxy", 1);

  // Grundlegende Security-Header. CSP wird deaktiviert, weil das Frontend
  // aktuell mit Inline-Event-Handlern (onclick="...") arbeitet; für mehr
  // Sicherheit wäre eine Umstellung auf addEventListener + eigene CSP sinnvoll.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "600kb" })); // Profilbilder (Base64) brauchen etwas mehr als Standard-JSON
  app.use(cookieParser());

  // REST-API
  app.use("/api", apiRouter);

  // Frontend (statisch) ausliefern
  // Cache-Control so gesetzt, dass Nutzer nach einem Deploy NIE manuell den
  // Cache leeren oder neu starten müssen: der Browser darf Dateien cachen,
  // muss sie aber bei jeder Anfrage per ETag beim Server validieren lassen
  // ("no-cache" heißt "immer nachfragen", nicht "nie speichern"). Ist die
  // Datei unverändert, kommt ein schnelles 304 zurück; hat sich was geändert,
  // gibt's sofort die neue Version — ganz ohne Hard-Refresh.
  app.use(express.static(path.join(__dirname, "public"), {
    etag: true,
    lastModified: true,
    setHeaders: (res) => res.setHeader("Cache-Control", "no-cache"),
  }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  app.use("/api", notFound);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`\n🎓 C# Quest läuft auf http://localhost:${config.port}`);
    console.log(`   Umgebung: ${config.nodeEnv}\n`);
  });
}

main().catch((err) => {
  console.error("[server] Start fehlgeschlagen:", err);
  process.exit(1);
});
