const LearningContext = require("../models/LearningContext");
const Concept = require("../models/Concept");
const QuizAttempt = require("../models/QuizAttempt");
const Assessment = require("../models/Assessment");

/*
=====================================================
GET OR CREATE LEARNING CONTEXT
=====================================================
*/

const getOrCreateLearningContext = async ({ userId, projectId }) => {
  let context = await LearningContext.findOne({
    userId,
    projectId,
  });

  if (!context) {
    context = await LearningContext.create({
      userId,
      projectId,
    });
  }

  return context;
};

/*
=====================================================
UPDATE LEARNING CONTEXT
=====================================================

This function rebuilds the useful learning context
from the student's current project performance.

We use:

- Concept mastery
- Quiz attempts
- Assessment results

The context is kept short so it can later be safely
provided to the AI Tutor.
=====================================================
*/

const updateLearningContext = async ({ userId, projectId }) => {
  const context = await getOrCreateLearningContext({
    userId,
    projectId,
  });

  /*
  -----------------------------------------------------
  Get current concept mastery
  -----------------------------------------------------
  */

  const concepts = await Concept.find({
    userId,
    projectId,
  })
    .sort({ masteryScore: -1 })
    .lean();

  /*
  -----------------------------------------------------
  Identify strengths and weaknesses
  -----------------------------------------------------
  */

  const strengths = concepts
    .filter((concept) => concept.masteryScore >= 75)
    .slice(0, 5)
    .map((concept) => concept.name);

  const weaknesses = concepts
    .filter((concept) => concept.masteryScore < 50)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 5)
    .map((concept) => concept.name);

  /*
  -----------------------------------------------------
  Get recent quiz attempt
  -----------------------------------------------------
  */

  const recentQuiz = await QuizAttempt.findOne({
    userId,
    projectId,
  })
    .sort({ createdAt: -1 })
    .lean();

  /*
  -----------------------------------------------------
  Get recent assessment
  -----------------------------------------------------
  */

  const recentAssessment = await Assessment.findOne({
    userId,
    projectId,
  })
    .sort({ createdAt: -1 })
    .lean();

  /*
  -----------------------------------------------------
  Collect recent mistakes
  -----------------------------------------------------
  */

  const recentMistakes = [];

  /*
  Quiz mistakes
  */

  if (recentQuiz?.questions) {
    for (const question of recentQuiz.questions) {
      if (!question.isCorrect && question.concept) {
        recentMistakes.push(question.concept);
      }
    }
  }

  /*
  Assessment missing concepts
  */

  if (recentAssessment?.missingConcepts) {
    for (const concept of recentAssessment.missingConcepts) {
      recentMistakes.push(concept);
    }
  }

  /*
  Remove duplicate mistakes
  */

  const uniqueMistakes = [
    ...new Set(recentMistakes.filter(Boolean).map((mistake) => mistake.trim())),
  ].slice(0, 10);

  /*
  -----------------------------------------------------
  Generate context notes
  -----------------------------------------------------
  */

  const contextNotes = [];

  if (strengths.length > 0) {
    contextNotes.push(
      `Student currently demonstrates strong understanding of: ${strengths.join(
        ", ",
      )}.`,
    );
  }

  if (weaknesses.length > 0) {
    contextNotes.push(
      `Student may need more practice with: ${weaknesses.join(", ")}.`,
    );
  }

  if (recentQuiz) {
    contextNotes.push(`Most recent quiz score: ${recentQuiz.percentage}%.`);
  }

  if (recentAssessment) {
    contextNotes.push(
      `Most recent open-ended assessment score: ${recentAssessment.score}%.`,
    );
  }

  if (uniqueMistakes.length > 0) {
    contextNotes.push(
      `Recent areas where the student struggled: ${uniqueMistakes.join(", ")}.`,
    );
  }

  /*
  -----------------------------------------------------
  Update context document
  -----------------------------------------------------
  */

  context.strengths = strengths;

  context.weaknesses = weaknesses;

  context.recentQuizScore = recentQuiz ? recentQuiz.percentage : null;

  context.recentAssessmentScore = recentAssessment
    ? recentAssessment.score
    : null;

  context.recentMistakes = uniqueMistakes;

  context.contextNotes = contextNotes;

  context.lastActivityAt = new Date();

  await context.save();

  return context;
};

/*
=====================================================
GET LEARNING CONTEXT
=====================================================
*/

const getLearningContext = async ({ userId, projectId }) => {
  const context = await LearningContext.findOne({
    userId,
    projectId,
  }).lean();

  return context;
};

module.exports = {
  getOrCreateLearningContext,
  updateLearningContext,
  getLearningContext,
};
