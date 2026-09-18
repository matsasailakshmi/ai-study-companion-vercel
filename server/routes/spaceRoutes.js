const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createSpace,
  getSpaces,
  deleteSpace,
} = require("../controllers/spaceController");

const router = express.Router();

router.use(protect);

router.post("/", createSpace);

router.get("/", getSpaces);

router.delete("/:id", deleteSpace);

module.exports = router;
