// Zentrale, einzige Stelle, die process.env liest.
// Der Rest der App importiert IMMER von hier statt process.env direkt zu benutzen.
require("dotenv").config();

const required = ["MONGODB_URI", "JWT_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[config] Fehlende Umgebungsvariablen: ${missing.join(", ")}`);
  console.error("[config] Bitte .env anlegen (siehe .env.example).");
  process.exit(1);
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
  mongoUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  },
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  cookieName: "cq_token",
};
