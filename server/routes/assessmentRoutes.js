const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  generateAssessment,
  submitAssessment,
  getAssessmentHistory,
} = require("../controllers/assessmentController");

// All assessment routes require authentication
router.use(protect);

// Generate a new open-ended assessment question
router.get("/:projectId/generate", generateAssessment);

// Submit an answer and receive AI evaluation
router.post("/:projectId/submit", submitAssessment);

// Get previous assessment attempts
router.get("/:projectId/history", getAssessmentHistory);

module.exports = router;
