const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/groupController");

router.use(requireAuth);

router.post("/", ctrl.createGroup);
router.get("/", ctrl.listMyGroups);
router.post("/join", ctrl.joinGroup);
router.get("/:id", ctrl.getGroup);
router.post("/:id/leave", ctrl.leaveGroup);
router.delete("/:id", ctrl.deleteGroup);
router.post("/:id/channels", ctrl.addChannel);
router.get("/:id/channels/:channelId/messages", ctrl.listChannelMessages);
router.post("/:id/channels/:channelId/messages", ctrl.sendChannelMessage);

module.exports = router;
