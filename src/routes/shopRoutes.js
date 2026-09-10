const express = require("express");
const { getShop, buyAvatar } = require("../controllers/shopController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", getShop);
router.post("/buy-avatar", buyAvatar);

module.exports = router;
