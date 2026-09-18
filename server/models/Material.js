const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    // User who owns this material
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Project this material belongs to
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    // Original uploaded file name
    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    // File location on the server
    filePath: {
      type: String,
      required: true,
    },

    // File type
    fileType: {
      type: String,
      default: "application/pdf",
    },

    // Processing state
    status: {
      type: String,
      enum: ["queued", "processing", "ready", "failed"],
      default: "queued",
    },

    // Number of pages in the PDF
    pageCount: {
      type: Number,
      default: 0,
    },

    // Extracted text from the PDF
    extractedText: {
      type: String,
      default: "",
    },

    // Error message if processing fails
    error: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Material", materialSchema);
