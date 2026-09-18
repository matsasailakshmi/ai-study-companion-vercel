const Project = require("../models/Project");

const { retrieveRelevantChunks } = require("../services/retrievalService");

const { generateTutorAnswer } = require("../services/aiTutorService");

const { createActivity } = require("../services/activityService");

const askTutor = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
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
      query: question,
      limit: 5,
    });

    const result = await generateTutorAnswer({
      question,
      chunks,
    });

    // Record successful AI Tutor interaction
    await createActivity({
      userId: req.user.userId,
      projectId: project._id,
      type: "tutor_interaction",
      title: "Asked AI Tutor a question",
      description: question.trim(),
      metadata: {
        question: question.trim(),
        sourceCount: result.sources ? result.sources.length : 0,
      },
    });

    return res.status(200).json({
      success: true,
      question,
      answer: result.answer,
      sources: result.sources,
    });
  } catch (error) {
    console.error("Tutor error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process tutor question",
    });
  }
};

module.exports = {
  askTutor,
};
