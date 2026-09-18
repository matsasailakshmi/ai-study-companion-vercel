const express = require("express");

const protect = require("../middleware/authMiddleware");
const { searchKnowledge } = require("../controllers/retrievalController");

const router = express.Router();

router.get("/:projectId/search", protect, searchKnowledge);

module.exports = router;
