const config = require("../../config/config");
const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { ROLE_DEFAULTS } = require("../config/permissions");

// Liest das JWT aus dem httpOnly-Cookie, lädt den zugehörigen Nutzer und
// hängt ihn als req.user an. Wirft 401, wenn kein/ein ungültiges Token vorliegt.
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[config.cookieName];
  if (!token) throw new ApiError(401, "Nicht angemeldet.");

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    res.clearCookie(config.cookieName);
    throw new ApiError(401, "Sitzung abgelaufen, bitte erneut anmelden.");
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    res.clearCookie(config.cookieName);
    throw new ApiError(401, "Nutzer existiert nicht mehr.");
  }
  if (user.banned) {
    if (user.bannedUntil && new Date(user.bannedUntil) <= new Date()) {
      user.banned = false; user.banReason = ""; user.bannedUntil = null; user.bannedIps = [];
      await user.save();
    } else {
      throw new ApiError(403, "Dieses Konto wurde gesperrt.");
    }
  }

  req.user = user;
  next();
});

// Wenn ein Token vorhanden/gültig ist, req.user setzen — sonst einfach weiter
// (für Endpunkte, die sowohl eingeloggt als auch anonym erreichbar sind).
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[config.cookieName];
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (user && !user.banned) req.user = user;
  } catch {
    /* ignorieren, Nutzer bleibt anonym */
  }
  next();
});

// Prüft eine konkrete Permission anhand des RANGS (nicht mehr individuell
// pro Nutzer vergebbar — nur noch admin/moderator/user, siehe config/permissions.js).
function authorize(permission) {
  return (req, res, next) => {
    if (!req.user) throw new ApiError(401, "Nicht angemeldet.");
    if (req.user.role === "admin") return next();
    const roleGrants = ROLE_DEFAULTS[req.user.role] || [];
    if (roleGrants.includes(permission)) return next();
    throw new ApiError(403, "Keine Berechtigung für diese Aktion.");
  };
}

module.exports = { requireAuth, optionalAuth, authorize };
