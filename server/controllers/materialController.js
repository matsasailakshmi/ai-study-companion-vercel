const fs = require("fs");

const Material = require("../models/Material");
const Project = require("../models/Project");
const { createActivity } = require("../services/activityService");

// Upload a PDF
const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
    }

    const { projectId } = req.params;

    // Check that the project belongs to the logged-in user
    const project = await Project.findOne({
      _id: projectId,
      userId: req.user.userId,
    });

    if (!project) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Create material with queued status
    const material = await Material.create({
      userId: req.user.userId,
      projectId: project._id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      status: "queued",
    });

    // Record material upload activity
    await createActivity({
      userId: req.user.userId,
      projectId: project._id,
      type: "material_uploaded",
      title: "Uploaded learning material",
      description: `Uploaded "${material.fileName}"`,
      metadata: {
        materialId: material._id,
        fileName: material.fileName,
        fileType: material.fileType,
      },
    });

    return res.status(201).json({
      success: true,
      message: "PDF uploaded successfully and queued for processing",
      material,
    });
  } catch (error) {
    console.error("Upload material error:", error);

    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (fileError) {
        console.error("Failed to delete uploaded file:", fileError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload material",
    });
  }
};

// Get all materials for a project
const getProjectMaterials = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check that the project belongs to the logged-in user
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

    const materials = await Material.find({
      projectId: project._id,
      userId: req.user.userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      materials,
    });
  } catch (error) {
    console.error("Get materials error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get materials",
    });
  }
};

module.exports = {
  uploadMaterial,
  getProjectMaterials,
};
