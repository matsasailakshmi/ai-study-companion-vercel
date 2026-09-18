/**
 * Generate a recommendation for one concept
 * based on its mastery and growth status.
 */
const generateConceptRecommendation = (growth) => {
  const mastery = growth.currentMastery || 0;
  const status = growth.status || "Stable";
  const recentAccuracy = growth.recentAccuracy || 0;

  // 1. Very low mastery + needs attention
  if (status === "Needs Attention" && mastery < 40) {
    return {
      type: "review",
      title: `Review ${growth.conceptName}`,
      action: "Review the learning material and revisit the core concepts.",
      reason: `Your current mastery is ${mastery}% and this concept needs more attention.`,
    };
  }

  // 2. Needs attention
  if (status === "Needs Attention") {
    return {
      type: "practice",
      title: `Practice ${growth.conceptName}`,
      action: "Review the weak areas and take another quiz.",
      reason: `Your recent accuracy is ${recentAccuracy}% and this concept needs more practice.`,
    };
  }

  // 3. Low mastery
  if (mastery < 40) {
    return {
      type: "review",
      title: `Review ${growth.conceptName}`,
      action:
        "Go through the learning material again before attempting another quiz.",
      reason: `Your current mastery is ${mastery}%, so the fundamentals need reinforcement.`,
    };
  }

  // 4. Moderate mastery
  if (mastery < 60) {
    return {
      type: "practice",
      title: `Practice ${growth.conceptName}`,
      action: "Take another quiz to strengthen your understanding.",
      reason: `Your current mastery is ${mastery}%, so additional practice can help.`,
    };
  }

  // 5. High mastery + improving
  if (status === "Improving" && mastery >= 80) {
    return {
      type: "challenge",
      title: `Challenge yourself on ${growth.conceptName}`,
      action: "Try a more challenging quiz to test deeper understanding.",
      reason: `Your mastery is ${mastery}% and your recent performance is improving.`,
    };
  }

  // 6. Improving
  if (status === "Improving") {
    return {
      type: "practice",
      title: `Continue practicing ${growth.conceptName}`,
      action: "Continue with another quiz to reinforce your progress.",
      reason: `Your recent performance is improving with ${recentAccuracy}% recent accuracy.`,
    };
  }

  // 7. Stable + high mastery
  if (status === "Stable" && mastery >= 80) {
    return {
      type: "challenge",
      title: `Deepen your ${growth.conceptName} knowledge`,
      action: "Try a harder quiz or move to more advanced material.",
      reason: `Your mastery is ${mastery}%, but recent performance is stable.`,
    };
  }

  // 8. Default recommendation
  return {
    type: "practice",
    title: `Practice ${growth.conceptName}`,
    action: "Take another quiz to reinforce your understanding.",
    reason: `Your current mastery is ${mastery}%.`,
  };
};

/**
 * Generate recommendations for all concepts
 * in a project.
 */
const generateProjectRecommendations = (growthData) => {
  if (!Array.isArray(growthData)) {
    return [];
  }

  return growthData.map((growth) => {
    return {
      conceptId: growth.conceptId,
      conceptName: growth.conceptName,
      status: growth.status,
      currentMastery: growth.currentMastery,
      recentAccuracy: growth.recentAccuracy,

      recommendation: generateConceptRecommendation(growth),
    };
  });
};

/**
 * Select the most important next action
 * from all project recommendations.
 */
const generateNextAction = (recommendations) => {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return null;
  }

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    // Highest priority: concepts needing attention
    if (a.status === "Needs Attention" && b.status !== "Needs Attention") {
      return -1;
    }

    if (a.status !== "Needs Attention" && b.status === "Needs Attention") {
      return 1;
    }

    // If both have the same status,
    // prioritize lower mastery.
    return (a.currentMastery || 0) - (b.currentMastery || 0);
  });

  const selected = sortedRecommendations[0];

  return {
    conceptId: selected.conceptId,
    conceptName: selected.conceptName,
    status: selected.status,
    currentMastery: selected.currentMastery,
    recentAccuracy: selected.recentAccuracy,
    recommendation: selected.recommendation,
  };
};

module.exports = {
  generateConceptRecommendation,
  generateProjectRecommendations,
  generateNextAction,
};
