const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, logout, me, requestUnban, changeUsername } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Schutz gegen Brute-Force auf Login/Register: max 20 Versuche pro 15 Min pro IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Zu viele Versuche. Bitte später erneut probieren." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/unban-request", authLimiter, requestUnban);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.patch("/username", requireAuth, changeUsername);

module.exports = router;
