const express = require("express");
const { coinflip, slots, higherLower } = require("../controllers/casinoController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.post("/coinflip", coinflip);
router.post("/slots", slots);
router.post("/higherlower", higherLower);

module.exports = router;
