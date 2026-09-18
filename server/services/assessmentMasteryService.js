const Concept = require("../models/Concept");
const { createActivity } = require("./activityService");

/*
=====================================================
UPDATE CONCEPT MASTERY FROM OPEN-ENDED ASSESSMENT
=====================================================

For an open-ended assessment:

understoodConcepts
    -> treated as demonstrated understanding
    -> correctAnswers + 1
    -> attempts + 1

missingConcepts
    -> treated as insufficient understanding
    -> incorrectAnswers + 1
    -> attempts + 1

Mastery:
    (correctAnswers / attempts) * 100

This keeps assessment mastery compatible with the
existing quiz mastery system.
=====================================================
*/

const updateAssessmentMastery = async ({
  userId,
  projectId,
  understoodConcepts = [],
  missingConcepts = [],
}) => {
  if (!userId || !projectId) {
    throw new Error(
      "userId and projectId are required for assessment mastery calculation.",
    );
  }

  if (!Array.isArray(understoodConcepts) || !Array.isArray(missingConcepts)) {
    throw new Error("understoodConcepts and missingConcepts must be arrays.");
  }

  /*
  -----------------------------------------------------
  Normalize concept names
  -----------------------------------------------------
  */

  const understood = new Set(
    understoodConcepts
      .filter((name) => typeof name === "string")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean),
  );

  const missing = new Set(
    missingConcepts
      .filter((name) => typeof name === "string")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean),
  );

  /*
  -----------------------------------------------------
  Prevent a concept from being counted twice
  -----------------------------------------------------

  If the AI accidentally places the same concept in
  both arrays, we treat it as missing rather than
  double-counting it.
  -----------------------------------------------------
  */

  for (const conceptName of understood) {
    if (missing.has(conceptName)) {
      understood.delete(conceptName);
    }
  }

  const updatedConcepts = [];

  /*
  -----------------------------------------------------
  Update understood concepts
  -----------------------------------------------------
  */

  for (const normalizedName of understood) {
    const concept = await Concept.findOne({
      userId,
      projectId,
      name: new RegExp(`^${escapeRegex(normalizedName)}$`, "i"),
    });

    if (!concept) {
      console.warn(`Assessment concept not found: ${normalizedName}`);

      continue;
    }

    concept.correctAnswers += 1;

    concept.attempts = concept.correctAnswers + concept.incorrectAnswers;

    concept.masteryScore = Math.round(
      (concept.correctAnswers / concept.attempts) * 100,
    );

    concept.lastAssessedAt = new Date();

    await concept.save();

    updatedConcepts.push(concept);

    await createActivity({
      userId,
      projectId,
      type: "mastery_updated",
      title: "Updated concept mastery from assessment",
      description: `${concept.name} mastery updated to ${concept.masteryScore}%`,
      metadata: {
        conceptId: concept._id,
        conceptName: concept.name,
        masteryScore: concept.masteryScore,
        attempts: concept.attempts,
        correctAnswers: concept.correctAnswers,
        incorrectAnswers: concept.incorrectAnswers,
        source: "open_ended_assessment",
      },
    });
  }

  /*
  -----------------------------------------------------
  Update missing concepts
  -----------------------------------------------------
  */

  for (const normalizedName of missing) {
    const concept = await Concept.findOne({
      userId,
      projectId,
      name: new RegExp(`^${escapeRegex(normalizedName)}$`, "i"),
    });

    if (!concept) {
      console.warn(`Assessment concept not found: ${normalizedName}`);

      continue;
    }

    concept.incorrectAnswers += 1;

    concept.attempts = concept.correctAnswers + concept.incorrectAnswers;

    concept.masteryScore = Math.round(
      (concept.correctAnswers / concept.attempts) * 100,
    );

    concept.lastAssessedAt = new Date();

    await concept.save();

    updatedConcepts.push(concept);

    await createActivity({
      userId,
      projectId,
      type: "mastery_updated",
      title: "Updated concept mastery from assessment",
      description: `${concept.name} mastery updated to ${concept.masteryScore}%`,
      metadata: {
        conceptId: concept._id,
        conceptName: concept.name,
        masteryScore: concept.masteryScore,
        attempts: concept.attempts,
        correctAnswers: concept.correctAnswers,
        incorrectAnswers: concept.incorrectAnswers,
        source: "open_ended_assessment",
      },
    });
  }

  return updatedConcepts;
};

/*
=====================================================
ESCAPE REGEX SPECIAL CHARACTERS
=====================================================

Concept names may contain characters such as:

+
*
?
(
)
[
]

Escaping them prevents them from being interpreted
as regular-expression operators.
=====================================================
*/

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  updateAssessmentMastery,
};
