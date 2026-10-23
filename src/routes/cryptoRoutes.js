const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/cryptoController");

router.use(requireAuth);

router.get("/", ctrl.getState);
router.post("/open", ctrl.openPosition);
router.post("/close", ctrl.closePosition);
router.post("/reset", ctrl.resetBalance);

module.exports = router;
