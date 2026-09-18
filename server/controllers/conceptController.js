const Project = require("../models/Project");
const Concept = require("../models/Concept");
const KnowledgeChunk = require("../models/KnowledgeChunk");

const { extractConcepts } = require("../services/conceptService");

/* =====================================================
   EXTRACT CONCEPTS FROM PROJECT MATERIAL
===================================================== */

const generateProjectConcepts = async (req, res) => {
  try {
    const { projectId } = req.params;

    /* -----------------------------------------------
       Verify project belongs to logged-in user
    ------------------------------------------------ */

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    /* -----------------------------------------------
       Get ALL knowledge chunks for this project
       
       We intentionally do NOT use keyword retrieval
       here because concept extraction should analyze
       the complete project material.
    ------------------------------------------------ */

    const chunks = await KnowledgeChunk.find({
      projectId: project._id,
      userId: req.user.userId,
    })
      .sort({ chunkIndex: 1 })
      .lean();

    if (!chunks || chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No processed learning material is available for concept extraction.",
      });
    }

    console.log(
      `Found ${chunks.length} knowledge chunks for concept extraction`,
    );

    /* -----------------------------------------------
       Extract concepts using Gemini
    ------------------------------------------------ */

    const extractedConcepts = await extractConcepts({
      chunks,
      numberOfConcepts: 10,
    });

    console.log(`Gemini extracted ${extractedConcepts.length} concepts`);

    /* -----------------------------------------------
       Save / update concepts
    ------------------------------------------------ */

    const savedConcepts = [];

    for (const concept of extractedConcepts) {
      const savedConcept = await Concept.findOneAndUpdate(
        {
          userId: req.user.userId,
          projectId: project._id,
          name: concept.name,
        },

        {
          $set: {
            description: concept.description,
          },
        },

        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );

      savedConcepts.push(savedConcept);
    }

    return res.status(200).json({
      success: true,
      message: "Project concepts extracted successfully",

      projectId,

      concepts: savedConcepts,
    });
  } catch (error) {
    console.error("Concept extraction error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to extract project concepts",
    });
  }
};

/* =====================================================
   GET PROJECT CONCEPTS
===================================================== */

const getProjectConcepts = async (req, res) => {
  try {
    const { projectId } = req.params;

    /* -----------------------------------------------
       Verify project belongs to logged-in user
    ------------------------------------------------ */

    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    /* -----------------------------------------------
       Get concepts
    ------------------------------------------------ */

    const concepts = await Concept.find({
      projectId: project._id,
      userId: req.user.userId,
    })
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      projectId,
      concepts,
    });
  } catch (error) {
    console.error("Get concepts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get project concepts",
    });
  }
};

module.exports = {
  generateProjectConcepts,
  getProjectConcepts,
};
