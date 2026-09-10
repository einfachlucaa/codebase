const config = require("../../config/config");

// 404 für alles, was keine Route trifft (nach den API-Routen eingehängt).
function notFound(req, res, next) {
  res.status(404).json({ error: "Route nicht gefunden." });
}

// Muss als letzte Middleware registriert werden (4 Argumente!).
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;

  // Mongoose Validation-/Duplicate-Key-Fehler in lesbare Meldungen umwandeln.
  let message = err.message || "Interner Serverfehler.";
  if (err.code === 11000) {
    message = "Dieser Nutzername ist bereits vergeben.";
  } else if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((e) => e.message).join(" ");
  }

  if (statusCode === 500) {
    console.error("[error]", err);
  }

  res.status(statusCode).json({
    error: message,
    ...(config.isProd ? {} : { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
