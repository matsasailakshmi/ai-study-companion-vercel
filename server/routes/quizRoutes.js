const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  generateProjectQuiz,
  saveQuizAttempt,
  getQuizAttempts,
} = require("../controllers/quizController");

const router = express.Router();

/* Generate quiz */

router.post("/:projectId/generate", protect, generateProjectQuiz);

/* Save quiz attempt */

router.post("/:projectId/attempt", protect, saveQuizAttempt);

/* Get previous quiz attempts */

router.get("/:projectId/attempts", protect, getQuizAttempts);

module.exports = router;
