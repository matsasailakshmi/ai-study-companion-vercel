const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createProject,
  getProjects,
  deleteProject,
} = require("../controllers/projectController");

const router = express.Router();

router.use(protect);

router.post("/", createProject);

router.get("/space/:spaceId", getProjects);

router.delete("/:id", deleteProject);

module.exports = router;
