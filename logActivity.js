const ActivityLog = require("../models/ActivityLog");

// Bewusst "fire and forget" mit catch: ein Logging-Fehler darf niemals
// die eigentliche Aktion (Login, Kauf, ...) zum Absturz bringen.
function logActivity(user, type, meta = {}) {
  ActivityLog.create({
    user: user._id,
    username: user.username,
    type,
    meta,
  }).catch((err) => console.warn("[activity] Log fehlgeschlagen:", err.message));
}

module.exports = logActivity;
