const Activity = require("../models/Activity");

const getRecentActivities = async (req, res) => {
  try {
    const activities = await Activity.find({
      userId: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Get recent activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load recent activities",
    });
  }
};

module.exports = {
  getRecentActivities,
};
