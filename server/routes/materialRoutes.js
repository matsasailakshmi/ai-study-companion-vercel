const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const protect = require("../middleware/authMiddleware");

const {
  uploadMaterial,
  getProjectMaterials,
} = require("../controllers/materialController");

const router = express.Router();

// Upload directory
const uploadDirectory = path.join(__dirname, "../uploads");

// Create uploads folder if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// Only allow PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Get all materials for a project
router.get("/:projectId", protect, getProjectMaterials);

// Upload PDF to a project
router.post(
  "/:projectId/upload",
  protect,
  upload.single("file"),
  uploadMaterial,
);

module.exports = router;
