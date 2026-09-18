const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "project_created",
        "material_uploaded",
        "material_processed",
        "tutor_interaction",
        "quiz_completed",
        "assessment_completed",
        "mastery_updated",
        "recommendation_generated",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

activitySchema.index({
  userId: 1,
  createdAt: -1,
});

activitySchema.index({
  userId: 1,
  projectId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Activity", activitySchema);
