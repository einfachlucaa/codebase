const config = require("../../config/config");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");

const COOKIE_OPTIONS = {
  httpOnly: true, // vor Zugriff durch clientseitiges JS (XSS) geschützt
  sameSite: "lax",
  secure: config.isProd, // in Produktion nur über HTTPS senden
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Tage
};

function sendAuthCookie(res, userId) {
  const token = signToken(userId);
  res.cookie(config.cookieName, token, COOKIE_OPTIONS);
}

const register = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

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

  const AVATARS = ["🧑‍💻", "👩‍💻", "🧑‍🚀", "🦊", "🐱", "🐼", "🐧", "🦄", "🐸", "🤖", "🐨", "🦁"];
  const user = new User({
    username: username.trim(),
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
  });
  await user.setPassword(password);
  await user.save();

  sendAuthCookie(res, user._id);
  res.status(201).json({ user });
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) throw new ApiError(400, "Nutzername und Passwort erforderlich.");

  // .select("+passwordHash") nötig, da das Feld im Model auf select:false steht.
  const user = await User.findOne({ username: username.trim() }).select("+passwordHash");
  if (!user) throw new ApiError(401, "Falscher Nutzername oder falsches Passwort.");
  if (user.banned) throw new ApiError(403, `Dieses Konto wurde gesperrt.${user.banReason ? " Grund: " + user.banReason : ""}`);

  const ok = await user.comparePassword(password);
  if (!ok) throw new ApiError(401, "Falscher Nutzername oder falsches Passwort.");

  user.lastLoginAt = new Date();
  await user.save();

  sendAuthCookie(res, user._id);
  res.json({ user });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(config.cookieName);
  res.json({ ok: true });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, logout, me };
