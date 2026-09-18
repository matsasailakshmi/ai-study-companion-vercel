const Activity = require("../models/Activity");

const createActivity = async ({
  userId,
  projectId = null,
  type,
  title,
  description = "",
  metadata = {},
}) => {
  try {
    const activity = await Activity.create({
      userId,
      projectId,
      type,
      title,
      description,
      metadata,
    });

    return activity;
  } catch (error) {
    // Activity logging should never break the main learning workflow.
    console.error("Activity creation failed:", error.message);
    return null;
  }
};

module.exports = {
  createActivity,
};
