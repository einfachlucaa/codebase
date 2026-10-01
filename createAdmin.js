// Nutzung:
//   node scripts/createAdmin.js <username> <password>
//
// Legt den Nutzer an (falls nicht vorhanden) und setzt role="admin".
// Existiert der Nutzer bereits, wird nur die Rolle auf admin gesetzt.
require("dotenv").config();
const mongoose = require("mongoose");
const config = require("../config/config");
const User = require("../src/models/User");

async function run() {
  const [, , username, password] = process.argv;
  if (!username || !password) {
    console.error("Nutzung: node scripts/createAdmin.js <username> <password>");
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri);

  let user = await User.findOne({ username });
  if (user) {
    user.role = "admin";
    await user.save();
    console.log(`✔ Nutzer "${username}" existierte bereits und ist jetzt Admin.`);
  } else {
    user = new User({ username, role: "admin" });
    await user.setPassword(password);
    await user.save();
    console.log(`✔ Admin-Account "${username}" wurde erstellt.`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
