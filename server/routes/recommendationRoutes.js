const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  getProjectRecommendations,
} = require("../controllers/recommendationController");

const router = express.Router();

router.get("/:projectId", protect, getProjectRecommendations);

module.exports = router;
