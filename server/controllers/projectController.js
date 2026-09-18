const Project = require("../models/Project");
const Space = require("../models/Space");
const { createActivity } = require("../services/activityService");

const createProject = async (req, res) => {
  try {
    const { spaceId, name, description, learningGoal } = req.body;

    if (!spaceId || !name || !learningGoal) {
      return res.status(400).json({
        success: false,
        message: "Space, project name, and learning goal are required",
      });
    }

    // Make sure the space belongs to the logged-in user
    const space = await Space.findOne({
      _id: spaceId,
      userId: req.user.userId,
    });

    if (!space) {
      return res.status(404).json({
        success: false,
        message: "Space not found",
      });
    }

    const project = await Project.create({
      userId: req.user.userId,
      spaceId,
      name,
      description: description || "",
      learningGoal,
    });

    // Record project creation activity
    await createActivity({
      userId: req.user.userId,
      projectId: project._id,
      type: "project_created",
      title: "Created a new project",
      description: `Created project "${project.name}"`,
      metadata: {
        projectName: project.name,
        spaceId: space._id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const { spaceId } = req.params;

    // Make sure the space belongs to the logged-in user
    const space = await Space.findOne({
      _id: spaceId,
      userId: req.user.userId,
    });

    if (!space) {
      return res.status(404).json({
        success: false,
        message: "Space not found",
      });
    }

    // IMPORTANT:
    // Only return projects belonging to this specific space
    const projects = await Project.find({
      userId: req.user.userId,
      spaceId: spaceId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow the logged-in user to delete their own project
    const project = await Project.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await Project.deleteOne({
      _id: id,
      userId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  deleteProject,
};
