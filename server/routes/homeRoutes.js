const express = require("express");

const protect = require("../middleware/authMiddleware");

const { getHomeDashboard } = require("../controllers/homeController");

const router = express.Router();

router.get("/", protect, getHomeDashboard);

module.exports = router;
