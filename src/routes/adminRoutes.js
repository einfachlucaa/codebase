const express = require("express");
const ctrl = require("../controllers/adminController");
const { requireAuth, authorize } = require("../middleware/auth");
const { PERMISSIONS } = require("../config/permissions");

const router = express.Router();
router.use(requireAuth);

router.get("/stats", authorize(PERMISSIONS.USERS_VIEW), ctrl.stats);
router.get("/activity", authorize(PERMISSIONS.ACTIVITY_VIEW), ctrl.listActivity);
router.get("/users", authorize(PERMISSIONS.USERS_VIEW), ctrl.listUsers);
router.get("/users/:id", authorize(PERMISSIONS.USERS_VIEW), ctrl.getUser);
router.patch("/users/:id/stats", authorize(PERMISSIONS.USERS_EDIT), ctrl.editStats);
router.patch("/users/:id/role", authorize(PERMISSIONS.USERS_ROLES), ctrl.setRole);
router.patch("/users/:id/ban", authorize(PERMISSIONS.USERS_BAN), ctrl.setBanned);
router.post("/users/:id/warn", authorize(PERMISSIONS.USERS_WARN), ctrl.warnUser);
router.delete("/users/:id/warnings", authorize(PERMISSIONS.USERS_WARN), ctrl.clearWarnings);
router.patch("/users/:id/clear-flag", authorize(PERMISSIONS.USERS_EDIT), ctrl.clearFlag);
router.get("/users/:id/messages", authorize(PERMISSIONS.MESSAGES_VIEW), ctrl.listUserMessages);
router.patch("/users/:id/reset-picture", authorize(PERMISSIONS.USERS_EDIT), ctrl.resetPicture);
router.patch("/users/:id/full", authorize(PERMISSIONS.USERS_EDIT), ctrl.fullUpdate);
router.post("/users/:id/kick", authorize(PERMISSIONS.USERS_BAN), ctrl.kickUser);
router.patch("/users/:id/mute", authorize(PERMISSIONS.USERS_BAN), ctrl.muteUser);
router.get("/unban-requests", authorize(PERMISSIONS.USERS_BAN), ctrl.listUnbanRequests);
router.post("/unban-requests/:id/review", authorize(PERMISSIONS.USERS_BAN), ctrl.reviewUnbanRequest);
router.delete("/users/:id", authorize(PERMISSIONS.USERS_DELETE), ctrl.deleteUser);

module.exports = router;
