const Space = require("../models/Space");

// Create a space
const createSpace = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Space name is required",
      });
    }

    const space = await Space.create({
      userId: req.user.userId,
      name,
      description,
    });

    res.status(201).json({
      success: true,
      space,
    });
  } catch (error) {
    console.error("Create space error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create space",
    });
  }
};

// Get user's spaces
const getSpaces = async (req, res) => {
  try {
    const spaces = await Space.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      spaces,
    });
  } catch (error) {
    console.error("Get spaces error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get spaces",
    });
  }
};

// Delete a space
const deleteSpace = async (req, res) => {
  try {
    const space = await Space.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!space) {
      return res.status(404).json({
        success: false,
        message: "Space not found",
      });
    }

    res.json({
      success: true,
      message: "Space deleted",
    });
  } catch (error) {
    console.error("Delete space error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete space",
    });
  }
};

module.exports = {
  createSpace,
  getSpaces,
  deleteSpace,
};
