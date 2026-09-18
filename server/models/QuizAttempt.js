const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema(
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

    questions: [
      {
        question: {
          type: String,
          required: true,
        },

        options: {
          type: [String],
          required: true,
        },

        correctAnswer: {
          type: Number,
          required: true,
        },

        explanation: {
          type: String,
          default: "",
        },

        /* ==========================================
           CONCEPT ASSOCIATED WITH QUESTION
        ========================================== */

        concept: {
          type: String,
          default: "",
        },

        selectedAnswer: {
          type: Number,
          default: null,
        },

        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],

    score: {
      type: Number,
      required: true,
      default: 0,
    },

    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
    },

    percentage: {
      type: Number,
      required: true,
      default: 0,
    },

    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

quizAttemptSchema.index({
  userId: 1,
  projectId: 1,
  createdAt: -1,
});

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
