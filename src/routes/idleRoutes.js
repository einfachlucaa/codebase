const express = require("express");
const ctrl = require("../controllers/idleController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/cookie", ctrl.getCookieState);
router.post("/cookie/collect", ctrl.collectCookie);
router.post("/cookie/upgrade", ctrl.buyCookieUpgrade);

router.get("/factory", ctrl.getFactoryState);
router.post("/factory/collect", ctrl.collectFactory);
router.post("/factory/upgrade", ctrl.buyFactoryGenerator);

module.exports = router;
