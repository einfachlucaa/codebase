// Alle möglichen Permission-Strings im System. Diese werden NICHT mehr
// individuell pro Nutzer vergeben (siehe adminController) — sie sind fest an
// die 3 Ränge gekoppelt. So ist immer klar: die Rolle bestimmt die Rechte.
const PERMISSIONS = {
  USERS_VIEW: "users.view",
  USERS_EDIT: "users.edit",       // Coins/XP/Level anpassen (nur Admin)
  USERS_BAN: "users.ban",
  USERS_WARN: "users.warn",
  USERS_DELETE: "users.delete",   // nur Admin
  USERS_ROLES: "users.roles",     // Ränge ändern (nur Admin)
  ACTIVITY_VIEW: "activity.view",
  MESSAGES_VIEW: "messages.view", // Moderationszugriff auf private Nachrichten
};

// Feste Rechte je Rang. Admin bypasst ohnehin alles (siehe middleware/auth.js:authorize).
const ROLE_DEFAULTS = {
  user: [],
  // Moderator bekommt das komplette "moderatorische" Werkzeug: Nutzer
  // einsehen, verwarnen, (zeitlich) sperren, Aktivität & Chats zur
  // Moderation einsehen. KEINE Coins/XP-Bearbeitung, KEINE Rollen/Löschung.
  moderator: [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_WARN, PERMISSIONS.USERS_BAN, PERMISSIONS.ACTIVITY_VIEW, PERMISSIONS.MESSAGES_VIEW],
  admin: Object.values(PERMISSIONS),
};

// Ab dieser Anzahl aktiver Verwarnungen wird ein Account automatisch gesperrt.
const AUTO_BAN_AFTER_WARNINGS = 3;

const ROLES = ["user", "moderator", "admin"];

module.exports = { PERMISSIONS, ROLE_DEFAULTS, ROLES, AUTO_BAN_AFTER_WARNINGS };
