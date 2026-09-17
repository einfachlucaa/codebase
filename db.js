const mongoose = require("mongoose");
const config = require("./config");

async function connectDB() {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[db] MongoDB verbunden: ${mongoose.connection.host}`);
  } catch (err) {
    console.error("[db] MongoDB-Verbindung fehlgeschlagen:", err.message);
    console.error(
      "[db] Prüfe MONGODB_URI in .env sowie IP-Whitelist im MongoDB Atlas Network Access."
    );
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB-Verbindung getrennt.");
  });
}

module.exports = connectDB;
