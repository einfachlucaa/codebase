const express = require("express");
const { getProgress, saveProgress, updateProfile } = require("../controllers/progressController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", getProgress);
router.put("/", saveProgress);
router.patch("/profile", updateProfile);

module.exports = router;
