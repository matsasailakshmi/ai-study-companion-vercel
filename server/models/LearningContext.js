const mongoose = require("mongoose");

const learningContextSchema = new mongoose.Schema(
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

    /*
    =========================================
    LEARNING PROFILE
    =========================================
    */

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    /*
    =========================================
    RECENT PERFORMANCE
    =========================================
    */

    recentQuizScore: {
      type: Number,
      default: null,
    },

    recentAssessmentScore: {
      type: Number,
      default: null,
    },

    /*
    =========================================
    LEARNING HISTORY
    =========================================
    */

    recentMistakes: {
      type: [String],
      default: [],
    },

    lastActivityAt: {
      type: Date,
      default: null,
    },

    /*
    =========================================
    CONTEXT NOTES
    =========================================

    These are short useful facts generated from
    the student's learning activity.

    Example:

    "Student is currently struggling with
    convolution."

    "Student recently improved in Fourier Series."
    =========================================
    */

    contextNotes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

/*
=====================================================
ONE CONTEXT DOCUMENT PER USER + PROJECT
=====================================================
*/

learningContextSchema.index(
  {
    userId: 1,
    projectId: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("LearningContext", learningContextSchema);
