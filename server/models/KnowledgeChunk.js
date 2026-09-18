const mongoose = require("mongoose");

const knowledgeChunkSchema = new mongoose.Schema(
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

    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },

    text: {
      type: String,
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    pageNumber: {
      type: Number,
      default: null,
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

knowledgeChunkSchema.index({
  projectId: 1,
  materialId: 1,
  chunkIndex: 1,
});

module.exports = mongoose.model("KnowledgeChunk", knowledgeChunkSchema);
