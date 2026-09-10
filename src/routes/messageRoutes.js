const express = require("express");
const ctrl = require("../controllers/messageController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/stickers", ctrl.getStickers);
router.get("/unread", ctrl.getUnreadCounts);
router.get("/:id", ctrl.getConversation);
router.post("/:id", ctrl.sendMessage);

module.exports = router;
