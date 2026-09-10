const express = require("express");
const router = express.Router();

router.use("/auth", require("./authRoutes"));
router.use("/progress", require("./progressRoutes"));
router.use("/leaderboard", require("./leaderboardRoutes"));
router.use("/shop", require("./shopRoutes"));
router.use("/casino", require("./casinoRoutes"));
router.use("/friends", require("./friendsRoutes"));
router.use("/admin", require("./adminRoutes"));

module.exports = router;
