const express = require("express");
const ctrl = require("../controllers/projectController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", ctrl.listProjects);
router.post("/", ctrl.createProject);
router.patch("/:id", ctrl.updateProject);
router.delete("/:id", ctrl.deleteProject);

module.exports = router;
