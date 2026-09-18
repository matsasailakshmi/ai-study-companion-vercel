const Project = require("../models/Project");

const { calculateProjectGrowth } = require("../services/growthService");

const {
  classifyProjectGrowth,
} = require("../services/growthClassificationService");

/**
 * Get growth analysis for a project.
 */
const getProjectGrowth = async (req, res) => {
  try {
    const { projectId } = req.params;

    /* -----------------------------------------------
       Verify that the project belongs to the user
    ------------------------------------------------ */

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    /* -----------------------------------------------
       Step 5A
       Calculate raw growth data
    ------------------------------------------------ */

    const growthData = await calculateProjectGrowth({
      userId: req.user.userId,
      projectId: project._id,
    });

    /* -----------------------------------------------
       Step 5B
       Classify growth
    ------------------------------------------------ */

    const classifiedGrowth = classifyProjectGrowth(growthData);

    /* -----------------------------------------------
       Return growth analysis
    ------------------------------------------------ */

    return res.status(200).json({
      success: true,
      projectId,
      growth: classifiedGrowth,
    });
  } catch (error) {
    console.error("Growth analysis error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate growth analysis",
    });
  }
};

module.exports = {
  getProjectGrowth,
};
