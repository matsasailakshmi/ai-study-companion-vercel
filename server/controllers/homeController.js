const { getHomeDashboardData } = require("../services/homeService");

const getHomeDashboard = async (req, res) => {
  try {
    const data = await getHomeDashboardData(req.user.userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Home dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load home dashboard",
    });
  }
};

module.exports = {
  getHomeDashboard,
};
