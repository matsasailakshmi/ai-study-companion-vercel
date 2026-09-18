const Space = require("../models/Space");
const Project = require("../models/Project");
const Concept = require("../models/Concept");
const { calculateProjectGrowth } = require("./growthService");
const { classifyProjectGrowth } = require("./growthClassificationService");

/**
 * Get the dashboard data for a user.
 */
const getHomeDashboardData = async (userId) => {
  // Get user's spaces
  const spaces = await Space.find({
    userId,
  })
    .sort({ createdAt: -1 })
    .lean();

  // Get user's projects
  const projects = await Project.find({
    userId,
  })
    .sort({ updatedAt: -1 })
    .lean();

  /*
   * Calculate growth information for each project.
   * This allows the Home dashboard to know which
   * concepts need attention.
   */
  const projectProgress = [];

  for (const project of projects) {
    const growth = await calculateProjectGrowth({
      userId,
      projectId: project._id,
    });

    const classifiedGrowth = classifyProjectGrowth(growth);

    projectProgress.push({
      projectId: project._id,
      projectName: project.name,
      growth: classifiedGrowth,
    });
  }

  /*
   * Find concepts that need attention across
   * the user's projects.
   */
  const attentionAreas = [];

  for (const project of projectProgress) {
    for (const concept of project.growth) {
      if (concept.status === "Needs Attention") {
        attentionAreas.push({
          projectId: project.projectId,
          projectName: project.projectName,
          conceptId: concept.conceptId,
          conceptName: concept.conceptName,
          mastery: concept.currentMastery,
          recentAccuracy: concept.recentAccuracy,
          status: concept.status,
        });
      }
    }
  }

  /*
   * Sort attention areas by mastery.
   * Lower mastery comes first.
   */
  attentionAreas.sort((a, b) => a.mastery - b.mastery);

  /*
   * Calculate overall mastery across all
   * concepts belonging to the user.
   */
  const concepts = await Concept.find({
    userId,
  }).lean();

  let overallMastery = 0;

  if (concepts.length > 0) {
    const totalMastery = concepts.reduce(
      (sum, concept) => sum + (concept.masteryScore || 0),
      0,
    );

    overallMastery = Math.round(totalMastery / concepts.length);
  }

  /*
   * Recent projects.
   *
   * Projects are already sorted by updatedAt,
   * so take the first five.
   */
  const recentProjects = projects.slice(0, 5).map((project) => ({
    projectId: project._id,
    name: project.name,
    description: project.description,
    learningGoal: project.learningGoal,
    spaceId: project.spaceId,
    updatedAt: project.updatedAt,
  }));

  return {
    spaces,
    projects,
    recentProjects,
    projectProgress,
    attentionAreas,
    overallMastery,
  };
};

module.exports = {
  getHomeDashboardData,
};
