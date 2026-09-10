const express = require("express");
const ctrl = require("../controllers/adminController");
const { requireAuth, authorize } = require("../middleware/auth");
const { PERMISSIONS } = require("../config/permissions");

const router = express.Router();
router.use(requireAuth);

router.get("/stats", authorize(PERMISSIONS.USERS_VIEW), ctrl.stats);
router.get("/users", authorize(PERMISSIONS.USERS_VIEW), ctrl.listUsers);
router.get("/users/:id", authorize(PERMISSIONS.USERS_VIEW), ctrl.getUser);
router.patch("/users/:id/stats", authorize(PERMISSIONS.USERS_EDIT), ctrl.editStats);
router.patch("/users/:id/role", authorize(PERMISSIONS.USERS_ROLES), ctrl.setRole);
router.patch("/users/:id/permissions", authorize(PERMISSIONS.USERS_ROLES), ctrl.setPermissions);
router.patch("/users/:id/ban", authorize(PERMISSIONS.USERS_BAN), ctrl.setBanned);
router.delete("/users/:id", authorize(PERMISSIONS.USERS_DELETE), ctrl.deleteUser);

module.exports = router;
