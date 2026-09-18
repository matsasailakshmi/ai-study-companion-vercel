const Project = require("../models/Project");
const { retrieveRelevantChunks } = require("../services/retrievalService");

const searchKnowledge = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

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

    const chunks = await retrieveRelevantChunks({
      projectId: project._id,
      userId: req.user.userId,
      query: q,
      limit: 5,
    });

    return res.status(200).json({
      success: true,
      query: q,
      results: chunks,
    });
  } catch (error) {
    console.error("Knowledge search error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search knowledge",
    });
  }
};

module.exports = {
  searchKnowledge,
};
