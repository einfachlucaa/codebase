const express = require("express");
const { getSubscription, buySubscription } = require("../controllers/subscriptionController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", getSubscription);
router.post("/buy", buySubscription);

module.exports = router;
