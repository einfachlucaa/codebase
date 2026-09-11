const express = require("express");
const router = express.Router();

router.use("/auth", require("./authRoutes"));
router.use("/progress", require("./progressRoutes"));
router.use("/leaderboard", require("./leaderboardRoutes"));
router.use("/shop", require("./shopRoutes"));
router.use("/casino", require("./casinoRoutes"));
router.use("/friends", require("./friendsRoutes"));
router.use("/messages", require("./messageRoutes"));
router.use("/idle", require("./idleRoutes"));
router.use("/subscription", require("./subscriptionRoutes"));
router.use("/projects", require("./projectRoutes"));
router.use("/code", require("./codeRoutes"));
router.use("/admin", require("./adminRoutes"));

module.exports = router;
