// Alle möglichen Permission-Strings im System.
// "admin"-Rolle darf immer alles (siehe middleware/auth.js:authorize).
const PERMISSIONS = {
  USERS_VIEW: "users.view",
  USERS_EDIT: "users.edit",       // Coins/XP/Level anpassen
  USERS_BAN: "users.ban",
  USERS_WARN: "users.warn",
  USERS_DELETE: "users.delete",
  USERS_ROLES: "users.roles",     // Rollen/Permissions anderer Nutzer ändern
  ACTIVITY_VIEW: "activity.view",
  MESSAGES_VIEW: "messages.view", // Moderationszugriff auf private Nachrichten
};

// Standard-Permissions je Rolle (zusätzlich zu evtl. individuell vergebenen).
const ROLE_DEFAULTS = {
  user: [],
  moderator: [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_WARN, PERMISSIONS.USERS_BAN, PERMISSIONS.ACTIVITY_VIEW],
  admin: Object.values(PERMISSIONS), // wird durch authorize() ohnehin immer erlaubt
};

// Ab dieser Anzahl aktiver Verwarnungen wird ein Account automatisch gesperrt.
const AUTO_BAN_AFTER_WARNINGS = 3;

const ROLES = ["user", "moderator", "admin"];

module.exports = { PERMISSIONS, ROLE_DEFAULTS, ROLES, AUTO_BAN_AFTER_WARNINGS };
