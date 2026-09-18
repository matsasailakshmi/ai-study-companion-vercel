const Project = require("../models/Project");
const QuizAttempt = require("../models/QuizAttempt");
const Concept = require("../models/Concept");

const { retrieveRelevantChunks } = require("../services/retrievalService");

const { generateQuiz } = require("../services/quizService");
const { updateConceptMastery } = require("../services/masteryService");
const { createActivity } = require("../services/activityService");

/* =====================================================
   GENERATE PROJECT QUIZ
===================================================== */

const generateProjectQuiz = async (req, res) => {
  try {
    const { projectId } = req.params;

    /* -----------------------------------------------
       Verify project belongs to logged-in user
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
       Get project concepts
    ------------------------------------------------ */

    const concepts = await Concept.find({
      projectId: project._id,
      userId: req.user.userId,
    })
      .sort({ name: 1 })
      .lean();

    if (!concepts || concepts.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No project concepts are available. Please generate concepts before generating a quiz.",
      });
    }

    /* -----------------------------------------------
       Get relevant project knowledge
    ------------------------------------------------ */

    const chunks = await retrieveRelevantChunks({
      projectId: project._id,
      userId: req.user.userId,
      query:
        "important concepts definitions principles methods examples applications key points",
      limit: 15,
    });

    if (!chunks || chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Not enough processed learning material is available to generate a quiz.",
      });
    }

    /* -----------------------------------------------
       Generate quiz using:
       - Project material
       - Project concepts
    ------------------------------------------------ */

    const quiz = await generateQuiz({
      chunks,
      concepts,
      numberOfQuestions: 5,
    });

    return res.status(200).json({
      success: true,
      projectId,
      questions: quiz.questions,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate quiz",
    });
  }
};

/* =====================================================
   SAVE QUIZ ATTEMPT
===================================================== */

const saveQuizAttempt = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { questions, answers } = req.body;

    /* -----------------------------------------------
       Verify project belongs to logged-in user
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
       Validate questions
    ------------------------------------------------ */

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Quiz questions are required",
      });
    }

    /* -----------------------------------------------
       Validate answers
    ------------------------------------------------ */

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Quiz answers are required",
      });
    }

    if (answers.length !== questions.length) {
      return res.status(400).json({
        success: false,
        message: "Number of answers must match number of questions",
      });
    }

    /* -----------------------------------------------
       Get valid concepts for this project
    ------------------------------------------------ */

    const concepts = await Concept.find({
      projectId: project._id,
      userId: req.user.userId,
    })
      .select("name")
      .lean();

    const validConceptNames = new Set(concepts.map((concept) => concept.name));

    /* -----------------------------------------------
       Evaluate quiz
    ------------------------------------------------ */

    let score = 0;

    const evaluatedQuestions = questions.map((question, index) => {
      const selectedAnswer = answers[index];

      /* -------------------------------------------
           Validate concept
        ------------------------------------------- */

      if (!question.concept || !validConceptNames.has(question.concept)) {
        throw new Error(
          `Invalid concept "${question.concept}" in quiz question.`,
        );
      }

      /* -------------------------------------------
           Validate selected answer
        ------------------------------------------- */

      const isValidSelectedAnswer =
        Number.isInteger(selectedAnswer) &&
        selectedAnswer >= 0 &&
        selectedAnswer < question.options.length;

      const finalSelectedAnswer = isValidSelectedAnswer ? selectedAnswer : null;

      /* -------------------------------------------
           Check correctness
        ------------------------------------------- */

      const isCorrect =
        finalSelectedAnswer !== null &&
        finalSelectedAnswer === question.correctAnswer;

      if (isCorrect) {
        score++;
      }

      return {
        question: question.question,

        options: question.options,

        correctAnswer: question.correctAnswer,

        explanation: question.explanation || "",

        concept: question.concept,

        selectedAnswer: finalSelectedAnswer,

        isCorrect,
      };
    });

    /* -----------------------------------------------
       Calculate percentage
    ------------------------------------------------ */

    const totalQuestions = questions.length;

    const percentage =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    /* -----------------------------------------------
       Save quiz attempt
    ------------------------------------------------ */

    const attempt = await QuizAttempt.create({
      userId: req.user.userId,

      projectId: project._id,

      questions: evaluatedQuestions,

      score,

      totalQuestions,

      percentage,

      completedAt: new Date(),
    });

    /* -----------------------------------------------
       UPDATE CONCEPT MASTERY
    ------------------------------------------------ */

    let updatedConcepts = [];

    try {
      updatedConcepts = await updateConceptMastery({
        userId: req.user.userId,
        projectId: project._id,
        questions: evaluatedQuestions,
      });

      console.log(`Updated mastery for ${updatedConcepts.length} concepts`);
    } catch (masteryError) {
      /*
       * Quiz attempt is already saved.
       * If mastery calculation fails, don't lose
       * the student's quiz result.
       */

      console.error("Concept mastery update failed:", masteryError);
    }

    /* -----------------------------------------------
       Record quiz completion activity
    ------------------------------------------------ */

    await createActivity({
      userId: req.user.userId,
      projectId: project._id,
      type: "quiz_completed",
      title: "Completed a quiz",
      description: `Scored ${score}/${totalQuestions} (${percentage}%)`,
      metadata: {
        attemptId: attempt._id,
        score,
        totalQuestions,
        percentage,
      },
    });

    /* -----------------------------------------------
       Return result
    ------------------------------------------------ */

    return res.status(201).json({
      success: true,

      message: "Quiz attempt saved successfully",

      attempt: {
        id: attempt._id,

        projectId: attempt.projectId,

        score: attempt.score,

        totalQuestions: attempt.totalQuestions,

        percentage: attempt.percentage,

        completedAt: attempt.completedAt,

        questions: attempt.questions,
      },

      mastery: updatedConcepts.map((concept) => ({
        concept: concept.name,
        masteryScore: concept.masteryScore,
        attempts: concept.attempts,
        correctAnswers: concept.correctAnswers,
        incorrectAnswers: concept.incorrectAnswers,
        lastAssessedAt: concept.lastAssessedAt,
      })),
    });
  } catch (error) {
    console.error("Save quiz attempt error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save quiz attempt",
    });
  }
};

/* =====================================================
   GET QUIZ ATTEMPTS
===================================================== */

const getQuizAttempts = async (req, res) => {
  try {
    const { projectId } = req.params;

    /* -----------------------------------------------
       Verify project belongs to logged-in user
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
       Get attempts for this project
    ------------------------------------------------ */

    const attempts = await QuizAttempt.find({
      projectId: project._id,
      userId: req.user.userId,
    })
      .sort({
        completedAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,

      projectId,

      attempts,
    });
  } catch (error) {
    console.error("Get quiz attempts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get quiz attempts",
    });
  }
};

module.exports = {
  generateProjectQuiz,
  saveQuizAttempt,
  getQuizAttempts,
};
