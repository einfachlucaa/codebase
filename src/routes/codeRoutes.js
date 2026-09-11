const express = require("express");
const rateLimit = require("express-rate-limit");
const { runCode } = require("../controllers/codeController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Max 20 Ausführungen pro 5 Minuten pro IP — schützt den kostenlosen
// Drittanbieter-Dienst (und unser eigenes Kontingent dort) vor Missbrauch.
const runLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Zu viele Ausführungen. Bitte kurz warten." },
});

router.post("/run", runLimiter, runCode);

module.exports = router;
