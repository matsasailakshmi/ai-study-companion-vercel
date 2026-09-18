const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
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

    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    =========================================
    AI EVALUATION
    =========================================
    */

    score: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    accuracy: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    relevance: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    reasoning: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },

    feedback: {
      type: String,
      default: "",
    },

    understoodConcepts: {
      type: [String],
      default: [],
    },

    missingConcepts: {
      type: [String],
      default: [],
    },

    /*
    =========================================
    SOURCE REFERENCES
    =========================================
    */

    sources: {
      type: [
        {
          fileName: {
            type: String,
            default: "Unknown",
          },

          chunkIndex: {
            type: Number,
            default: null,
          },

          pageNumber: {
            type: Number,
            default: null,
          },
        },
      ],
      default: [],
    },

    /*
    =========================================
    STATUS
    =========================================
    */

    status: {
      type: String,
      enum: ["pending", "evaluated", "failed"],
      default: "pending",
    },

    error: {
      type: String,
      default: "",
    },

    evaluatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
=====================================================
INDEX
=====================================================
*/

assessmentSchema.index({
  userId: 1,
  projectId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Assessment", assessmentSchema);
