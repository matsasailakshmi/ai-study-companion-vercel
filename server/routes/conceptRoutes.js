const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  generateProjectConcepts,
  getProjectConcepts,
} = require("../controllers/conceptController");

const router = express.Router();

/* Extract concepts using Gemini */

router.post("/:projectId/generate", protect, generateProjectConcepts);

/* Get saved concepts */

router.get("/:projectId", protect, getProjectConcepts);

module.exports = router;
