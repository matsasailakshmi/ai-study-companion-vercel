const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const { getAdminDashboard } = require("../controllers/adminController");

/*
  Admin authorization middleware.

  Authentication is handled by protect().
  This middleware additionally verifies that the
  authenticated user has role = "admin" in MongoDB.
*/

const requireAdmin = async (req, res, next) => {
  try {
    const User = require("../models/User");

    const user = await User.findById(req.user.userId).select("role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify admin access",
    });
  }
};

router.use(protect);
router.use(requireAdmin);

router.get("/dashboard", getAdminDashboard);

module.exports = router;
