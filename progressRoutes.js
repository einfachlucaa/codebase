const express = require("express");
const { getProgress, saveProgress, updateProfile, completeOnboarding, completeTutorial } = require("../controllers/progressController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", getProgress);
router.put("/", saveProgress);
router.patch("/profile", updateProfile);
router.patch("/onboarding-complete", completeOnboarding);
router.patch("/tutorial-complete", completeTutorial);

module.exports = router;
