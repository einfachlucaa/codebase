const express = require("express");
const ctrl = require("../controllers/friendsController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/search", ctrl.searchUsers);
router.get("/", ctrl.listFriends);
router.post("/request/:id", ctrl.sendRequest);
router.post("/respond/:id", ctrl.respondRequest);
router.delete("/:id", ctrl.removeFriend);

module.exports = router;
