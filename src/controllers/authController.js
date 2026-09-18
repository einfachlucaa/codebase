const config = require("../../config/config");
const User = require("../models/User");
const UnbanRequest = require("../models/UnbanRequest");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");
const logActivity = require("../utils/logActivity");

const COOKIE_OPTIONS = {
  httpOnly: true, // vor Zugriff durch clientseitiges JS (XSS) geschützt
  sameSite: "lax",
  secure: config.isProd, // in Produktion nur über HTTPS senden
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Tage
};

function sendAuthCookie(res, userId, tokenVersion) {
  const token = signToken(userId, tokenVersion);
  res.cookie(config.cookieName, token, COOKIE_OPTIONS);
}

const register = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    throw new ApiError(400, "Der Nutzername muss mindestens 3 Zeichen haben.");
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
    throw new ApiError(400, "Nutzername darf nur Buchstaben, Zahlen und _ enthalten (3-20 Zeichen).");
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    throw new ApiError(400, "Das Passwort muss mindestens 6 Zeichen haben.");
  }

  const existing = await User.findOne({ username: username.trim() });
  if (existing) throw new ApiError(409, "Dieser Nutzername ist bereits vergeben.");

  // Ban-Evasion-Schutz: kommt die Registrierung von derselben IP wie ein
  // aktuell gesperrter Account, wird sie abgelehnt. HINWEIS: das ist kein
  // hundertprozentiger Schutz (geteilte Schul-/WLAN-IPs, VPNs), aber blockt
  // den häufigsten Fall (einfach neu registrieren) zuverlässig ab.
  if (ip) {
    const bannedMatch = await User.findOne({ banned: true, bannedIps: ip });
    if (bannedMatch) {
      throw new ApiError(
        403,
        "Von diesem Gerät/Netzwerk aus wurde bereits ein Konto gesperrt. Neuregistrierung ist deshalb nicht möglich — du kannst stattdessen auf der Login-Seite eine Entsperrung für dein altes Konto beantragen."
      );
    }
  }

  const AVATARS = ["🧑‍💻", "👩‍💻", "🧑‍🚀", "🦊", "🐱", "🐼", "🐧", "🦄", "🐸", "🤖", "🐨", "🦁"];
  const user = new User({
    username: username.trim(),
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    registrationIp: ip || null,
    lastLoginIp: ip || null,
  });
  await user.setPassword(password);
  await user.save();

  sendAuthCookie(res, user._id, user.tokenVersion);
  logActivity(user, "register", { ip });
  res.status(201).json({ user });
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) throw new ApiError(400, "Nutzername und Passwort erforderlich.");

  // .select("+passwordHash") nötig, da das Feld im Model auf select:false steht.
  const user = await User.findOne({ username: username.trim() }).select("+passwordHash");
  if (!user) throw new ApiError(401, "Falscher Nutzername oder falsches Passwort.");

  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, "Falscher Nutzername oder falsches Passwort.");

  // Passwort-Check bewusst VOR der Ban-Prüfung, damit man ohne korrektes
  // Passwort nicht herausfinden kann, ob ein bestimmter Account gesperrt ist.
  if (user.banned) {
    // Zeitlich befristete Sperre abgelaufen? -> automatisch entsperren.
    if (user.bannedUntil && new Date(user.bannedUntil) <= new Date()) {
      user.banned = false; user.banReason = ""; user.bannedUntil = null; user.bannedIps = [];
    } else {
      const untilText = user.bannedUntil ? ` (bis ${new Date(user.bannedUntil).toLocaleString("de-DE")})` : "";
      throw new ApiError(403, `Dieses Konto wurde gesperrt${untilText}.${user.banReason ? " Grund: " + user.banReason : ""}`);
    }
  }

  user.lastLoginAt = new Date();
  if (req.ip) user.lastLoginIp = req.ip;
  await user.save();

  sendAuthCookie(res, user._id, user.tokenVersion);
  logActivity(user, "login", { ip: req.ip });
  res.json({ user });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(config.cookieName);
  res.json({ ok: true });
});

const me = asyncHandler(async (req, res) => {
  // "Wird geprüft"-Status läuft nach 15 Minuten automatisch ab (falls ein
  // Admin das Bearbeiten-Fenster vergessen hat zu schließen).
  if (req.user.underReviewAt && Date.now() - req.user.underReviewAt.getTime() > 15 * 60 * 1000) {
    req.user.underReviewBy = null;
    req.user.underReviewAt = null;
    await req.user.save();
  }
  res.json({ user: req.user });
});

// Öffentlicher Endpunkt (kein Login nötig, gesperrte Nutzer können sich ja
// nicht einloggen): Entsperrung mit Begründung beantragen.
const requestUnban = asyncHandler(async (req, res) => {
  const { username, reason } = req.body;
  if (!username || !reason || !reason.trim()) {
    throw new ApiError(400, "Nutzername und Begründung sind erforderlich.");
  }
  const user = await User.findOne({ username: username.trim() });
  if (!user || !user.banned) {
    throw new ApiError(404, "Kein gesperrtes Konto mit diesem Nutzernamen gefunden.");
  }
  const existingPending = await UnbanRequest.findOne({ user: user._id, status: "pending" });
  if (existingPending) throw new ApiError(409, "Für dieses Konto läuft bereits eine Entsperrungs-Anfrage.");

  await UnbanRequest.create({ user: user._id, username: user.username, reason: reason.trim().slice(0, 500) });
  res.status(201).json({ ok: true });
});

// Eigenen Nutzernamen ändern. Da der JWT nur die User-ID (nicht den Namen)
// enthält, bleibt die bestehende Login-Sitzung dabei gültig — kein Re-Login nötig.
const changeUsername = asyncHandler(async (req, res) => {
  const { newUsername } = req.body;
  if (!newUsername || typeof newUsername !== "string") throw new ApiError(400, "Neuer Nutzername fehlt.");
  const trimmed = newUsername.trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
    throw new ApiError(400, "Nutzername darf nur Buchstaben, Zahlen und _ enthalten (3-20 Zeichen).");
  }
  if (trimmed === req.user.username) throw new ApiError(400, "Das ist bereits dein aktueller Nutzername.");
  const existing = await User.findOne({ username: trimmed });
  if (existing) throw new ApiError(409, "Dieser Nutzername ist bereits vergeben.");

  const oldName = req.user.username;
  req.user.username = trimmed;
  await req.user.save();
  logActivity(req.user, "role_change", { action: "username_change", from: oldName, to: trimmed });
  res.json({ user: req.user });
});

module.exports = { register, login, logout, me, requestUnban, changeUsername };
