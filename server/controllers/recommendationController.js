const Project = require("../models/Project");
const { calculateProjectGrowth } = require("../services/growthService");
const {
  classifyProjectGrowth,
} = require("../services/growthClassificationService");
const {
  generateProjectRecommendations,
  generateNextAction,
} = require("../services/recommendationService");
const { createActivity } = require("../services/activityService");

const getProjectRecommendations = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify that the project belongs to the logged-in user
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

    // Step 1: Calculate growth
    const growth = await calculateProjectGrowth({
      userId: req.user.userId,
      projectId,
    });

    // Step 2: Classify growth
    const classifiedGrowth = classifyProjectGrowth(growth);

    // Step 3: Generate recommendation for every concept
    const recommendations = generateProjectRecommendations(classifiedGrowth);

    // Step 4: Select the personalized next action
    const nextAction = generateNextAction(recommendations);

    // Step 5: Record recommendation activity
    if (nextAction) {
      await createActivity({
        userId: req.user.userId,
        projectId: project._id,
        type: "recommendation_generated",
        title: "Generated a learning recommendation",
        description:
          nextAction.recommendation?.action ||
          nextAction.recommendation?.title ||
          "Generated a personalized next action",
        metadata: {
          conceptId: nextAction.conceptId,
          conceptName: nextAction.conceptName,
          status: nextAction.status,
          currentMastery: nextAction.currentMastery,
          recentAccuracy: nextAction.recentAccuracy,
          recommendationType: nextAction.recommendation?.type || null,
          recommendationTitle: nextAction.recommendation?.title || null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      projectId,
      recommendations,
      nextAction,
    });
  } catch (error) {
    console.error("Get recommendations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate recommendations",
    });
  }
};

module.exports = {
  getProjectRecommendations,
};
