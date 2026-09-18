const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const spaceRoutes = require("./routes/spaceRoutes");
const projectRoutes = require("./routes/projectRoutes");
const materialRoutes = require("./routes/materialRoutes");
const retrievalRoutes = require("./routes/retrievalRoutes");
const tutorRoutes = require("./routes/tutorRoutes");
const quizRoutes = require("./routes/quizRoutes");
const conceptRoutes = require("./routes/conceptRoutes");
const growthRoutes = require("./routes/growthRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const homeRoutes = require("./routes/homeRoutes");
const activityRoutes = require("./routes/activityRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const { startMaterialWorker } = require("./workers/materialWorker");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/retrieval", retrievalRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/concepts", conceptRoutes);
app.use("/api/growth", growthRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Study Companion backend is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

startMaterialWorker();
