const express = require("express");

const protect = require("../middleware/authMiddleware");

const { askTutor } = require("../controllers/tutorController");

const router = express.Router();

router.post("/:projectId/ask", protect, askTutor);

module.exports = router;
