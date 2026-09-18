import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ProgressOverview from "../components/ProgressOverview";

function Home() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const [homeData, setHomeData] = useState(null);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState("");

  const [nextAction, setNextAction] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  /* =========================================
     LOAD HOME DASHBOARD DATA
  ========================================= */

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/home`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load dashboard");
        }

        setHomeData(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchHomeData();
    } else {
      navigate("/login");
    }
  }, [API_URL, navigate, token]);

  /* =========================================
     LOAD RECENT ACTIVITY
  ========================================= */

  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!token) {
        return;
      }

      try {
        setActivityLoading(true);

        const response = await fetch(`${API_URL}/activity/recent`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load recent activity");
        }

        setActivities(data.activities || []);
      } catch (err) {
        console.error("Failed to load recent activity:", err);
        setActivities([]);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchRecentActivities();
  }, [API_URL, token]);

  /* =========================================
     CONTINUE LEARNING PROJECT
  ========================================= */

  const continueProject = homeData?.recentProjects?.[0] || null;

  /* =========================================
     LOAD PERSONALIZED NEXT ACTION
  ========================================= */

  useEffect(() => {
    const fetchNextAction = async () => {
      if (!continueProject?.projectId || !token) {
        return;
      }

      try {
        setRecommendationLoading(true);

        const response = await fetch(
          `${API_URL}/recommendations/${continueProject.projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load recommendation");
        }

        setNextAction(data.nextAction || null);
      } catch (err) {
        console.error("Failed to load next action:", err);
        setNextAction(null);
      } finally {
        setRecommendationLoading(false);
      }
    };

    fetchNextAction();
  }, [continueProject?.projectId, API_URL, token]);

  /* =========================================
     ACTIVITY ICON
  ========================================= */

  const getActivityIcon = (type) => {
    switch (type) {
      case "project_created":
        return "📚";

      case "material_uploaded":
        return "📄";

      case "material_processed":
        return "⚙️";

      case "tutor_interaction":
        return "🤖";

      case "quiz_completed":
        return "📝";

      case "assessment_completed":
        return "📋";

      case "mastery_updated":
        return "🎯";

      case "recommendation_generated":
        return "💡";

      default:
        return "✨";
    }
  };

  /* =========================================
     FORMAT ACTIVITY TIME
  ========================================= */

  const formatActivityTime = (date) => {
    if (!date) {
      return "";
    }

    const activityDate = new Date(date);

    if (Number.isNaN(activityDate.getTime())) {
      return "";
    }

    const now = new Date();

    const difference = now.getTime() - activityDate.getTime();

    const minutes = Math.floor(difference / (1000 * 60));
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    if (days < 7) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return activityDate.toLocaleDateString();
  };

  /* =========================================
     LOGOUT
  ========================================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  /* =========================================
     LOADING STATE
  ========================================= */

  if (loading) {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <Link to="/home" className="sidebar-brand">
            <span className="brand-icon">🧠</span>
            <span>StudyMate</span>
          </Link>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-loading">
            <p>Loading your learning dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  /* =========================================
     ERROR STATE
  ========================================= */

  if (error) {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <Link to="/home" className="sidebar-brand">
            <span className="brand-icon">🧠</span>
            <span>StudyMate</span>
          </Link>

          <nav className="sidebar-nav">
            <Link to="/home" className="sidebar-link active">
              <span>🏠</span>
              <span>Home</span>
            </Link>

            <Link to="/spaces" className="sidebar-link">
              <span>📚</span>
              <span>Learning Spaces</span>
            </Link>

            <Link to="/progress" className="sidebar-link">
              <span>📊</span>
              <span>Progress</span>
            </Link>

            <Link to="/ai-tutor" className="sidebar-link">
              <span>🤖</span>
              <span>AI Tutor</span>
            </Link>

            <Link to="/assessments" className="sidebar-link">
              <span>📝</span>
              <span>Assessments</span>
            </Link>

            <Link to="/profile" className="sidebar-link">
              <span>👤</span>
              <span>Profile</span>
            </Link>
          </nav>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-error">
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">
        <Link to="/home" className="sidebar-brand">
          <span className="brand-icon">🧠</span>
          <span>StudyMate</span>
        </Link>

        <nav className="sidebar-nav">
          {/* HOME */}
          <Link to="/home" className="sidebar-link active">
            <span>🏠</span>
            <span>Home</span>
          </Link>

          {/* LEARNING SPACES */}
          <Link to="/spaces" className="sidebar-link">
            <span>📚</span>
            <span>Learning Spaces</span>
          </Link>

          {/* PROGRESS */}
          <Link to="/progress" className="sidebar-link">
            <span>📊</span>
            <span>Progress</span>
          </Link>

          {/* AI TUTOR */}
          <Link to="/ai-tutor" className="sidebar-link">
            <span>🤖</span>
            <span>AI Tutor</span>
          </Link>

          {/* ASSESSMENTS */}
          <Link to="/assessments" className="sidebar-link">
            <span>📝</span>
            <span>Assessments</span>
          </Link>

          {/* PROFILE */}
          <Link to="/profile" className="sidebar-link">
            <span>👤</span>
            <span>Profile</span>
          </Link>
        </nav>

        {/* ADMIN DASHBOARD */}
        {user?.role === "admin" && (
          <Link to="/admin" className="sidebar-link">
            <span>🛡️</span>
            <span>Admin Dashboard</span>
          </Link>
        )}

        <div className="sidebar-bottom">
          <button
            className="sidebar-link sidebar-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <main className="dashboard-main">
        {/* ================= HEADER ================= */}

        <header className="dashboard-header">
          <div>
            <p className="dashboard-label">LEARNING WORKSPACE</p>

            <h1>Good evening, {user?.name || "Learner"} 👋</h1>
          </div>

          <div className="user-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
        </header>

        {/* ================= STATS ================= */}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>

            <div>
              <p className="stat-label">Active Projects</p>

              <h2>{homeData?.projects?.length || 0}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🧩</div>

            <div>
              <p className="stat-label">Concepts Learned</p>

              <h2>
                {homeData?.projectProgress?.reduce(
                  (total, project) => total + project.growth.length,
                  0,
                ) || 0}
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>

            <div>
              <p className="stat-label">Overall Progress</p>

              <h2>{homeData?.overallMastery || 0}%</h2>
            </div>
          </div>
        </section>

        {/* ================= PROGRESS OVERVIEW ================= */}

        <ProgressOverview
          overallMastery={homeData?.overallMastery || 0}
          attentionAreas={homeData?.attentionAreas || []}
        />

        {/* ================= CONTENT GRID ================= */}

        <section className="dashboard-grid">
          {/* ================= CONTINUE LEARNING ================= */}

          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">KEEP GOING</p>

                <h2>Continue Learning</h2>
              </div>

              <Link to="/spaces" className="section-link">
                View all →
              </Link>
            </div>

            {continueProject ? (
              <div className="learning-card">
                <div className="learning-card-top">
                  <div className="course-icon">
                    {continueProject.name?.charAt(0).toUpperCase() || "P"}
                  </div>

                  <div>
                    <h3>{continueProject.name}</h3>

                    <p>
                      {continueProject.description ||
                        continueProject.learningGoal ||
                        "Continue your learning journey"}
                    </p>
                  </div>
                </div>

                <div className="learning-card-footer">
                  <span>Last active recently</span>

                  <Link
                    to={`/projects/${continueProject.projectId}`}
                    className="continue-button"
                  >
                    Continue →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="learning-card">
                <div className="learning-card-top">
                  <div className="course-icon">📚</div>

                  <div>
                    <h3>No projects yet</h3>

                    <p>Create a learning project to start your journey.</p>
                  </div>
                </div>

                <div className="learning-card-footer">
                  <span>Start learning</span>

                  <Link to="/spaces" className="continue-button">
                    Create Project →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ================= NEXT ACTION ================= */}

          <div className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">PERSONALIZED</p>

                <h2>Next Action</h2>
              </div>
            </div>

            <div className="recommendation-card">
              <div className="recommendation-icon">🎯</div>

              <div>
                {recommendationLoading ? (
                  <>
                    <span className="attention-badge">ANALYZING</span>

                    <h3>Finding your next action...</h3>

                    <p>We're looking at your learning progress.</p>
                  </>
                ) : nextAction ? (
                  <>
                    <span className="attention-badge">{nextAction.status}</span>

                    <h3>{nextAction.recommendation.title}</h3>

                    <p>{nextAction.recommendation.reason}</p>

                    {continueProject && (
                      <Link
                        to={`/projects/${continueProject.projectId}`}
                        className="recommendation-button"
                      >
                        Continue Learning →
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <span className="attention-badge">GET STARTED</span>

                    <h3>Keep learning</h3>

                    <p>
                      Complete a quiz to receive a personalized next action.
                    </p>

                    {continueProject && (
                      <Link
                        to={`/projects/${continueProject.projectId}`}
                        className="recommendation-button"
                      >
                        Continue Learning →
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================= RECENT ACTIVITY ================= */}

        <section className="activity-section">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">YOUR JOURNEY</p>

              <h2>Recent Activity</h2>
            </div>
          </div>

          <div className="activity-list">
            {activityLoading ? (
              <div className="activity-item">
                <div className="activity-icon">⏳</div>

                <div className="activity-content">
                  <strong>Loading recent activity...</strong>

                  <span>Fetching your latest learning activities.</span>
                </div>
              </div>
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity._id} className="activity-item">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="activity-content">
                    <strong>{activity.title}</strong>

                    <span>{activity.description || "Learning activity"}</span>
                  </div>

                  <span className="activity-time">
                    {formatActivityTime(activity.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="activity-item">
                <div className="activity-icon">📚</div>

                <div className="activity-content">
                  <strong>No recent activity</strong>

                  <span>Start learning to see your activity here.</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
