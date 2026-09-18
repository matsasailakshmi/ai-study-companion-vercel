const Concept = require("../models/Concept");
const { createActivity } = require("./activityService");

/*
=====================================================
UPDATE CONCEPT MASTERY
=====================================================

This function receives the evaluated quiz questions
and updates the mastery statistics of each concept.

For every question:

Correct answer:
    correctAnswers + 1

Incorrect answer:
    incorrectAnswers + 1

Attempts:
    correctAnswers + incorrectAnswers

Mastery:
    (correctAnswers / attempts) * 100

After mastery is updated, a learning activity is
recorded for the project.
=====================================================
*/

const updateConceptMastery = async ({ userId, projectId, questions }) => {
  if (!userId || !projectId) {
    throw new Error(
      "userId and projectId are required for mastery calculation.",
    );
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Quiz questions are required for mastery calculation.");
  }

  /*
  -----------------------------------------------------
  Group quiz results by concept
  -----------------------------------------------------
  */

  const conceptResults = new Map();

  for (const question of questions) {
    const conceptName = question.concept?.trim();

    /*
    Skip questions that do not have a concept.
    */
    if (!conceptName) {
      continue;
    }

    if (!conceptResults.has(conceptName)) {
      conceptResults.set(conceptName, {
        correct: 0,
        incorrect: 0,
      });
    }

    const result = conceptResults.get(conceptName);

    if (question.isCorrect) {
      result.correct += 1;
    } else {
      result.incorrect += 1;
    }
  }

  /*
  -----------------------------------------------------
  Update each concept in MongoDB
  -----------------------------------------------------
  */

  const updatedConcepts = [];

  for (const [conceptName, result] of conceptResults) {
    const concept = await Concept.findOne({
      userId,
      projectId,
      name: conceptName,
    });

    /*
    If the concept does not exist, skip it.
    This prevents invalid quiz data from creating
    unwanted concepts.
    */

    if (!concept) {
      console.warn(`Concept not found: ${conceptName}`);

      continue;
    }

    /*
    Add the new quiz results to the existing
    concept statistics.
    */

    concept.correctAnswers += result.correct;

    concept.incorrectAnswers += result.incorrect;

    /*
    Total number of questions answered for
    this concept.
    */

    concept.attempts = concept.correctAnswers + concept.incorrectAnswers;

    /*
    Calculate mastery percentage.
    */

    if (concept.attempts > 0) {
      concept.masteryScore = Math.round(
        (concept.correctAnswers / concept.attempts) * 100,
      );
    } else {
      concept.masteryScore = 0;
    }

    /*
    Store the latest assessment time.
    */

    concept.lastAssessedAt = new Date();

    /*
    Save updated concept.
    */

    await concept.save();

    updatedConcepts.push(concept);

    /*
    -----------------------------------------------------
    Record mastery update activity
    -----------------------------------------------------
    */

    await createActivity({
      userId,
      projectId,
      type: "mastery_updated",
      title: "Updated concept mastery",
      description: `${conceptName} mastery updated to ${concept.masteryScore}%`,
      metadata: {
        conceptId: concept._id,
        conceptName: concept.name,
        masteryScore: concept.masteryScore,
        attempts: concept.attempts,
        correctAnswers: concept.correctAnswers,
        incorrectAnswers: concept.incorrectAnswers,
      },
    });
  }

  return updatedConcepts;
};

module.exports = {
  updateConceptMastery,
};
