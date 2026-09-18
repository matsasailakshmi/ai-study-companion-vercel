const Concept = require("../models/Concept");
const QuizAttempt = require("../models/QuizAttempt");
const Assessment = require("../models/Assessment");

/**
 * Calculate detailed growth and analytics data
 * for all concepts in a user's project.
 *
 * Includes:
 * - Overall concept accuracy
 * - Recent accuracy
 * - Previous accuracy
 * - Accuracy change
 * - Current mastery
 * - Mastery change
 * - Quiz history
 * - Assessment history
 */
const calculateProjectGrowth = async ({ userId, projectId }) => {
  if (!userId || !projectId) {
    throw new Error("userId and projectId are required for growth analysis.");
  }

  /*
   * -------------------------------------------------------
   * Get concepts
   * -------------------------------------------------------
   */
  const concepts = await Concept.find({
    userId,
    projectId,
  })
    .sort({ name: 1 })
    .lean();

  if (!concepts || concepts.length === 0) {
    return [];
  }

  /*
   * -------------------------------------------------------
   * Get quiz attempts
   * -------------------------------------------------------
   */
  const quizAttempts = await QuizAttempt.find({
    userId,
    projectId,
  })
    .sort({
      completedAt: -1,
      createdAt: -1,
    })
    .lean();

  /*
   * -------------------------------------------------------
   * Get open-ended assessments
   * -------------------------------------------------------
   */
  const assessments = await Assessment.find({
    userId,
    projectId,
    status: "evaluated",
  })
    .sort({
      evaluatedAt: -1,
      createdAt: -1,
    })
    .lean();

  /*
   * -------------------------------------------------------
   * Create case-insensitive concept lookup
   * -------------------------------------------------------
   */
  const conceptMap = new Map();

  for (const concept of concepts) {
    const normalizedName = concept.name.trim().toLowerCase();

    conceptMap.set(normalizedName, {
      concept,
      attempts: [],
      assessmentScores: [],
    });
  }

  /*
   * -------------------------------------------------------
   * Process quiz questions
   * -------------------------------------------------------
   */
  for (const attempt of quizAttempts) {
    if (!Array.isArray(attempt.questions)) {
      continue;
    }

    for (const question of attempt.questions) {
      const conceptName = question.concept?.trim();

      if (!conceptName) {
        continue;
      }

      const normalizedName = conceptName.toLowerCase();

      const performance = conceptMap.get(normalizedName);

      if (!performance) {
        continue;
      }

      performance.attempts.push({
        isCorrect: question.isCorrect === true,

        completedAt: attempt.completedAt || attempt.createdAt,
      });
    }
  }

  /*
   * -------------------------------------------------------
   * Process open-ended assessments
   *
   * An assessment can contain multiple understood
   * and missing concepts.
   * -------------------------------------------------------
   */
  for (const assessment of assessments) {
    const score =
      typeof assessment.score === "number" ? assessment.score : null;

    if (score === null) {
      continue;
    }

    const conceptsMentioned = [
      ...(assessment.understoodConcepts || []),
      ...(assessment.missingConcepts || []),
    ];

    const uniqueConceptNames = [
      ...new Set(
        conceptsMentioned
          .map((name) => String(name).trim().toLowerCase())
          .filter(Boolean),
      ),
    ];

    for (const conceptName of uniqueConceptNames) {
      const performance = conceptMap.get(conceptName);

      if (!performance) {
        continue;
      }

      performance.assessmentScores.push({
        score,
        evaluatedAt: assessment.evaluatedAt || assessment.createdAt,
      });
    }
  }

  /*
   * -------------------------------------------------------
   * Build final analytics
   * -------------------------------------------------------
   */
  const growthData = [];

  for (const concept of concepts) {
    const normalizedName = concept.name.trim().toLowerCase();

    const performance = conceptMap.get(normalizedName);

    const attempts = performance?.attempts || [];

    const assessmentScores = performance?.assessmentScores || [];

    /*
     * -----------------------------------------------------
     * Quiz statistics
     * -----------------------------------------------------
     */
    const totalAttempts = attempts.length;

    const totalCorrect = attempts.filter((item) => item.isCorrect).length;

    const totalIncorrect = totalAttempts - totalCorrect;

    const overallAccuracy =
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    /*
     * -----------------------------------------------------
     * Recent quiz performance
     *
     * Latest 3 concept-level questions.
     * -----------------------------------------------------
     */
    const recentAttempts = attempts.slice(0, 3);

    const recentCorrect = recentAttempts.filter(
      (item) => item.isCorrect,
    ).length;

    const recentAccuracy =
      recentAttempts.length > 0
        ? Math.round((recentCorrect / recentAttempts.length) * 100)
        : 0;

    /*
     * -----------------------------------------------------
     * Previous quiz performance
     *
     * Questions 4-6.
     * -----------------------------------------------------
     */
    const previousAttempts = attempts.slice(3, 6);

    const previousCorrect = previousAttempts.filter(
      (item) => item.isCorrect,
    ).length;

    const previousAccuracy =
      previousAttempts.length > 0
        ? Math.round((previousCorrect / previousAttempts.length) * 100)
        : null;

    /*
     * -----------------------------------------------------
     * Accuracy change
     * -----------------------------------------------------
     */
    const accuracyChange =
      previousAccuracy !== null ? recentAccuracy - previousAccuracy : null;

    /*
     * -----------------------------------------------------
     * Current mastery
     * -----------------------------------------------------
     */
    const currentMastery = concept.masteryScore || 0;

    /*
     * Estimate previous mastery.
     *
     * This is only an analytics estimate because the
     * Concept model currently stores the latest mastery,
     * not every historical mastery value.
     * -----------------------------------------------------
     */
    let previousMastery = currentMastery;

    if (previousAccuracy !== null && recentAttempts.length > 0) {
      previousMastery = Math.max(
        0,
        Math.min(100, Math.round(currentMastery - accuracyChange)),
      );
    }

    const masteryChange = currentMastery - previousMastery;

    /*
     * -----------------------------------------------------
     * Assessment statistics
     * -----------------------------------------------------
     */
    const assessmentCount = assessmentScores.length;

    const assessmentAverage =
      assessmentCount > 0
        ? Math.round(
            assessmentScores.reduce((sum, item) => sum + item.score, 0) /
              assessmentCount,
          )
        : null;

    const recentAssessmentScore =
      assessmentCount > 0 ? assessmentScores[0].score : null;

    /*
     * -----------------------------------------------------
     * Build history
     *
     * Useful for charts on the frontend.
     * -----------------------------------------------------
     */
    const quizHistory = attempts
      .slice()
      .reverse()
      .map((item, index) => ({
        attempt: index + 1,
        correct: item.isCorrect ? 1 : 0,
        accuracy: item.isCorrect ? 100 : 0,
        date: item.completedAt,
      }));

    const assessmentHistory = assessmentScores
      .slice()
      .reverse()
      .map((item, index) => ({
        attempt: index + 1,
        score: item.score,
        date: item.evaluatedAt,
      }));

    /*
     * -----------------------------------------------------
     * Add final concept analytics
     * -----------------------------------------------------
     */
    growthData.push({
      conceptId: concept._id,
      conceptName: concept.name,
      description: concept.description,

      currentMastery,

      previousMastery,

      masteryChange,

      totalAttempts,

      totalCorrect,

      totalIncorrect,

      overallAccuracy,

      recentAttempts: recentAttempts.length,

      recentAccuracy,

      previousAttempts: previousAttempts.length,

      previousAccuracy,

      accuracyChange,

      assessmentCount,

      assessmentAverage,

      recentAssessmentScore,

      quizHistory,

      assessmentHistory,

      lastAssessedAt: concept.lastAssessedAt,
    });
  }

  return growthData;
};

module.exports = {
  calculateProjectGrowth,
};
