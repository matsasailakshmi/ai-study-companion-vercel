const express = require("express");

const { getRecentActivities } = require("../controllers/activityController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

/*
=====================================================
ACTIVITY ROUTES
=====================================================

GET /api/activity/recent

Returns the latest learning activities for the
currently logged-in user.
=====================================================
*/

router.use(protect);

router.get("/recent", getRecentActivities);

module.exports = router;
