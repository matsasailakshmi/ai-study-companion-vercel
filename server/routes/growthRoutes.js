const express = require("express");

const protect = require("../middleware/authMiddleware");

const { getProjectGrowth } = require("../controllers/growthController");

const router = express.Router();

/**
 * GET
 * /api/growth/:projectId
 *
 * Returns growth analysis for a project.
 */
router.get("/:projectId", protect, getProjectGrowth);

module.exports = router;
