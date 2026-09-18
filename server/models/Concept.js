const mongoose = require("mongoose");

const conceptSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    masteryScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    correctAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    incorrectAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastAssessedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * A concept name should be unique
 * within a user's project.
 */

conceptSchema.index(
  {
    userId: 1,
    projectId: 1,
    name: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("Concept", conceptSchema);
