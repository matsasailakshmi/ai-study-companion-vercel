const User = require("../models/User");
const Space = require("../models/Space");
const Project = require("../models/Project");
const Activity = require("../models/Activity");

const getAdminDashboard = async (req, res) => {
  try {
    // Always verify the role from the database.
    // Never trust a role sent by the frontend.
    const adminUser = await User.findById(req.user.userId).select(
      "name email role",
    );

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const [
      totalUsers,
      totalSpaces,
      totalProjects,
      totalActivities,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments(),

      Space.countDocuments(),

      Project.countDocuments(),

      Activity.countDocuments(),

      Activity.find()
        .populate("userId", "name email")
        .populate("projectId", "name")
        .sort({ createdAt: -1 })
        .limit(15)
        .lean(),
    ]);

    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,

      admin: {
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },

      statistics: {
        totalUsers,
        totalSpaces,
        totalProjects,
        totalActivities,
      },

      users,

      recentActivities,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
};

module.exports = {
  getAdminDashboard,
};
