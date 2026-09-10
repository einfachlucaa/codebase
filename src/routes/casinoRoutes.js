const express = require("express");
const { coinflip, slots } = require("../controllers/casinoController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.post("/coinflip", coinflip);
router.post("/slots", slots);

module.exports = router;
