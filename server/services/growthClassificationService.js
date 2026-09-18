/**
 * Classify the learning growth of a concept.
 *
 * This service takes the raw growth data produced
 * by growthService.js and assigns a learning status.
 */

const classifyConceptGrowth = (growth) => {
  const currentMastery = growth.currentMastery || 0;

  const accuracyChange = growth.accuracyChange;

  /*
   * If there is enough history to compare
   * recent performance with previous performance,
   * use the accuracy change.
   */
  if (accuracyChange !== null) {
    /*
     * Significant improvement.
     */
    if (accuracyChange >= 15) {
      return "Improving";
    }

    /*
     * Significant decline OR very low mastery.
     */
    if (accuracyChange <= -15 || currentMastery < 50) {
      return "Needs Attention";
    }

    /*
     * Performance has not changed significantly.
     */
    return "Stable";
  }

  /*
   * Not enough quiz history for a trend.
   * Use current mastery as the fallback.
   */
  if (currentMastery < 50) {
    return "Needs Attention";
  }

  return "Stable";
};

/**
 * Add a growth status to every concept.
 */
const classifyProjectGrowth = (growthData) => {
  if (!Array.isArray(growthData)) {
    return [];
  }

  return growthData.map((growth) => ({
    ...growth,

    status: classifyConceptGrowth(growth),
  }));
};

module.exports = {
  classifyConceptGrowth,
  classifyProjectGrowth,
};
