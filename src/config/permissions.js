// Alle möglichen Permission-Strings im System.
// "admin"-Rolle darf immer alles (siehe middleware/auth.js:authorize).
const PERMISSIONS = {
  USERS_VIEW: "users.view",
  USERS_EDIT: "users.edit",       // Coins/XP/Level anpassen
  USERS_BAN: "users.ban",
  USERS_DELETE: "users.delete",
  USERS_ROLES: "users.roles",     // Rollen/Permissions anderer Nutzer ändern
};

// Standard-Permissions je Rolle (zusätzlich zu evtl. individuell vergebenen).
const ROLE_DEFAULTS = {
  user: [],
  moderator: [PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_BAN],
  admin: Object.values(PERMISSIONS), // wird durch authorize() ohnehin immer erlaubt
};

const ROLES = ["user", "moderator", "admin"];

module.exports = { PERMISSIONS, ROLE_DEFAULTS, ROLES };
