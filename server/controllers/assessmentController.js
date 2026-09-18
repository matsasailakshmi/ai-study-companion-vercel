const Project = require("../models/Project");
const Assessment = require("../models/Assessment");
const Concept = require("../models/Concept");

const { retrieveRelevantChunks } = require("../services/retrievalService");

const {
  generateAssessmentQuestion,
  evaluateAssessmentAnswer,
} = require("../services/assessmentService");

const {
  updateAssessmentMastery,
} = require("../services/assessmentMasteryService");

const { updateLearningContext } = require("../services/learningContextService");

const { createActivity } = require("../services/activityService");

// =====================================================
// GENERATE ASSESSMENT QUESTION
// =====================================================

const generateAssessment = async (req, res) => {
  try {
    const { projectId } = req.params;

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

    const concepts = await Concept.find({
      projectId: project._id,
      userId: req.user.userId,
    }).lean();

    const chunks = await retrieveRelevantChunks({
      projectId: project._id,
      userId: req.user.userId,
      query: "important concepts key ideas explanation understanding",
      limit: 5,
    });

    if (!chunks || chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No processed learning material is available for this project.",
      });
    }

    const result = await generateAssessmentQuestion({
      chunks,
    });

    return res.status(200).json({
      success: true,
      question: result.question,
      sources: result.sources,
      concepts: concepts.map((concept) => ({
        name: concept.name,
        description: concept.description,
        masteryScore: concept.masteryScore,
      })),
    });
  } catch (error) {
    console.error("Generate assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate assessment",
    });
  }
};

// =====================================================
// SUBMIT ASSESSMENT ANSWER
// =====================================================

const submitAssessment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { question, answer } = req.body;

    // -------------------------------------------------
    // Validate input
    // -------------------------------------------------

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    if (!answer || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: "Answer is required",
      });
    }

    // -------------------------------------------------
    // Verify project ownership
    // -------------------------------------------------

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

    // -------------------------------------------------
    // Get project concepts
    // -------------------------------------------------

    const concepts = await Concept.find({
      projectId: project._id,
      userId: req.user.userId,
    }).lean();

    // -------------------------------------------------
    // Retrieve relevant project material
    // -------------------------------------------------

    const chunks = await retrieveRelevantChunks({
      projectId: project._id,
      userId: req.user.userId,
      query: question,
      limit: 5,
    });

    if (!chunks || chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No processed learning material is available to evaluate this answer.",
      });
    }

    // -------------------------------------------------
    // Evaluate answer
    // -------------------------------------------------

    const evaluation = await evaluateAssessmentAnswer({
      question: question.trim(),
      answer: answer.trim(),
      chunks,
      concepts,
    });

    // -------------------------------------------------
    // Save assessment
    // -------------------------------------------------

    const assessment = await Assessment.create({
      userId: req.user.userId,
      projectId: project._id,

      question: question.trim(),
      answer: answer.trim(),

      score: evaluation.score,
      accuracy: evaluation.accuracy,
      relevance: evaluation.relevance,
      reasoning: evaluation.reasoning,

      feedback: evaluation.feedback,

      understoodConcepts: evaluation.understoodConcepts,
      missingConcepts: evaluation.missingConcepts,

      sources: chunks.map((chunk) => ({
        fileName: chunk.metadata?.sourceFileName || "Unknown",
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber || null,
      })),

      status: "evaluated",
      evaluatedAt: new Date(),
    });

    // -------------------------------------------------
    // Update concept mastery
    // -------------------------------------------------

    let updatedMastery = [];

    try {
      updatedMastery = await updateAssessmentMastery({
        userId: req.user.userId,
        projectId: project._id,
        understoodConcepts: evaluation.understoodConcepts,
        missingConcepts: evaluation.missingConcepts,
      });
    } catch (masteryError) {
      console.error("Assessment mastery update error:", masteryError);
    }

    // -------------------------------------------------
    // Update persistent learning context
    // -------------------------------------------------

    let learningContext = null;

    try {
      learningContext = await updateLearningContext({
        userId: req.user.userId,
        projectId: project._id,
      });
    } catch (contextError) {
      /*
      Assessment should still succeed if context
      generation fails.
      */

      console.error("Learning context update error:", contextError);
    }

    // -------------------------------------------------
    // Record assessment activity
    // -------------------------------------------------

    await createActivity({
      userId: req.user.userId,
      projectId: project._id,
      type: "assessment_completed",
      title: "Completed an open-ended assessment",
      description: `Assessment score: ${evaluation.score}%`,
      metadata: {
        assessmentId: assessment._id,
        score: evaluation.score,
        accuracy: evaluation.accuracy,
        relevance: evaluation.relevance,
        reasoning: evaluation.reasoning,
        understoodConcepts: evaluation.understoodConcepts,
        missingConcepts: evaluation.missingConcepts,
      },
    });

    // -------------------------------------------------
    // Return result
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      assessment: {
        id: assessment._id,

        question: assessment.question,
        answer: assessment.answer,

        score: assessment.score,
        accuracy: assessment.accuracy,
        relevance: assessment.relevance,
        reasoning: assessment.reasoning,

        feedback: assessment.feedback,

        understoodConcepts: assessment.understoodConcepts,
        missingConcepts: assessment.missingConcepts,

        sources: assessment.sources,

        status: assessment.status,
        evaluatedAt: assessment.evaluatedAt,
      },

      mastery: updatedMastery.map((concept) => ({
        id: concept._id,
        name: concept.name,
        masteryScore: concept.masteryScore,
        attempts: concept.attempts,
        correctAnswers: concept.correctAnswers,
        incorrectAnswers: concept.incorrectAnswers,
      })),

      learningContext: learningContext
        ? {
            strengths: learningContext.strengths,
            weaknesses: learningContext.weaknesses,
            recentQuizScore: learningContext.recentQuizScore,
            recentAssessmentScore: learningContext.recentAssessmentScore,
            recentMistakes: learningContext.recentMistakes,
            contextNotes: learningContext.contextNotes,
            lastActivityAt: learningContext.lastActivityAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Submit assessment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to evaluate assessment",
    });
  }
};

// =====================================================
// GET ASSESSMENT HISTORY
// =====================================================

const getAssessmentHistory = async (req, res) => {
  try {
    const { projectId } = req.params;

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

    const assessments = await Assessment.find({
      projectId: project._id,
      userId: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      assessments,
    });
  } catch (error) {
    console.error("Get assessment history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch assessment history",
    });
  }
};

module.exports = {
  generateAssessment,
  submitAssessment,
  getAssessmentHistory,
};
