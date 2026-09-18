import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Progress.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Progress() {
  const navigate = useNavigate();

  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchProgress = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

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
          throw new Error(data.message || "Failed to load progress");
        }

        setHomeData(data.data);
      } catch (err) {
        console.error("Progress error:", err);
        setError(err.message || "Failed to load progress");
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  /* =========================================
     LOADING
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
          <div className="progress-page-loading">Loading your progress...</div>
        </main>
      </div>
    );
  }

  /* =========================================
     ERROR
  ========================================= */

  if (error) {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <Link to="/home" className="sidebar-brand">
            <span className="brand-icon">🧠</span>
            <span>StudyMate</span>
          </Link>
        </aside>

        <main className="dashboard-main">
          <div className="progress-page-error">
            <h2>Unable to load progress</h2>
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const overallMastery = homeData?.overallMastery || 0;
  const attentionAreas = homeData?.attentionAreas || [];
  const projects = homeData?.projects || [];
  const projectProgress = homeData?.projectProgress || [];

  /* =========================================
     SUMMARY
  ========================================= */

  const allGrowth = projectProgress.flatMap((project) => project.growth || []);

  const improvingCount = allGrowth.filter(
    (item) => item.status === "Improving",
  ).length;

  const stableCount = allGrowth.filter(
    (item) => item.status === "Stable",
  ).length;

  const attentionCount = allGrowth.filter(
    (item) => item.status === "Needs Attention",
  ).length;

  return (
    <div className="dashboard">
      {/* =========================================
          SIDEBAR
      ========================================= */}

      <aside className="sidebar">
        <Link to="/home" className="sidebar-brand">
          <span className="brand-icon">🧠</span>
          <span>StudyMate</span>
        </Link>

        <nav className="sidebar-nav">
          <Link to="/home" className="sidebar-link">
            <span>🏠</span>
            <span>Home</span>
          </Link>

          <Link to="/spaces" className="sidebar-link">
            <span>📚</span>
            <span>Learning Spaces</span>
          </Link>

          <Link to="/progress" className="sidebar-link active">
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

      {/* =========================================
          MAIN
      ========================================= */}

      <main className="dashboard-main">
        <header className="progress-page-header">
          <div>
            <p className="progress-page-eyebrow">LEARNING ANALYTICS</p>

            <h1>Your Progress</h1>

            <p>
              Track your mastery, growth, and concepts that need more attention.
            </p>
          </div>

          <div className="progress-user-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
        </header>

        {/* =========================================
            SUMMARY CARDS
        ========================================= */}

        <section className="progress-summary-grid">
          <div className="progress-summary-card">
            <span className="progress-summary-icon">🎯</span>

            <div>
              <p>Overall Mastery</p>
              <strong>{overallMastery}%</strong>
            </div>
          </div>

          <div className="progress-summary-card">
            <span className="progress-summary-icon">📚</span>

            <div>
              <p>Active Projects</p>
              <strong>{projects.length}</strong>
            </div>
          </div>

          <div className="progress-summary-card">
            <span className="progress-summary-icon">🧩</span>

            <div>
              <p>Concepts Tracked</p>
              <strong>{allGrowth.length}</strong>
            </div>
          </div>

          <div className="progress-summary-card">
            <span className="progress-summary-icon">⚠️</span>

            <div>
              <p>Needs Attention</p>
              <strong>{attentionCount}</strong>
            </div>
          </div>
        </section>

        {/* =========================================
            OVERALL MASTERY
        ========================================= */}

        <section className="progress-main-card">
          <div className="progress-card-heading">
            <div>
              <p className="progress-page-eyebrow">OVERALL PROGRESS</p>

              <h2>Overall Mastery</h2>

              <p>Your current mastery across the concepts you have learned.</p>
            </div>

            <strong className="progress-large-number">{overallMastery}%</strong>
          </div>

          <div className="progress-large-track">
            <div
              className="progress-large-fill"
              style={{
                width: `${Math.min(overallMastery, 100)}%`,
              }}
            />
          </div>
        </section>

        {/* =========================================
            STATUS
        ========================================= */}

        <section className="progress-main-card">
          <div className="progress-card-heading">
            <div>
              <p className="progress-page-eyebrow">LEARNING STATUS</p>

              <h2>Growth Overview</h2>

              <p>See how your understanding is changing across concepts.</p>
            </div>
          </div>

          <div className="progress-status-grid">
            <div className="progress-status-card">
              <span>📈</span>
              <strong>{improvingCount}</strong>
              <p>Improving</p>
            </div>

            <div className="progress-status-card">
              <span>➡️</span>
              <strong>{stableCount}</strong>
              <p>Stable</p>
            </div>

            <div className="progress-status-card">
              <span>🎯</span>
              <strong>{attentionCount}</strong>
              <p>Needs Attention</p>
            </div>
          </div>
        </section>

        {/* =========================================
            FOCUS AREAS
        ========================================= */}

        <section className="progress-main-card">
          <div className="progress-card-heading">
            <div>
              <p className="progress-page-eyebrow">FOCUS AREAS</p>

              <h2>Areas Needing Attention</h2>

              <p>Concepts where additional practice may help.</p>
            </div>

            <span className="progress-count-badge">
              {attentionAreas.length}
            </span>
          </div>

          {attentionAreas.length === 0 ? (
            <div className="progress-empty-state">
              <span>🎉</span>

              <div>
                <strong>No concepts need attention right now.</strong>
                <p>Keep learning and completing assessments.</p>
              </div>
            </div>
          ) : (
            <div className="progress-attention-list">
              {attentionAreas.slice(0, 8).map((area, index) => (
                <div
                  className="progress-attention-item"
                  key={
                    area.conceptId ||
                    `${area.projectId}-${area.conceptName}-${index}`
                  }
                >
                  <div className="progress-attention-icon">🎯</div>

                  <div className="progress-attention-content">
                    <strong>{area.conceptName}</strong>

                    <span>{area.projectName || "Learning Project"}</span>
                  </div>

                  <div className="progress-attention-score">
                    <strong>{area.mastery || 0}%</strong>
                    <span>mastery</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =========================================
            PROJECT PROGRESS
        ========================================= */}

        <section className="progress-main-card">
          <div className="progress-card-heading">
            <div>
              <p className="progress-page-eyebrow">PROJECT PROGRESS</p>

              <h2>Progress by Project</h2>

              <p>Review your learning progress for each project.</p>
            </div>
          </div>

          {projectProgress.length === 0 ? (
            <div className="progress-empty-state">
              <span>📚</span>

              <div>
                <strong>No project progress yet.</strong>
                <p>Create a project and start learning.</p>
              </div>
            </div>
          ) : (
            <div className="progress-project-list">
              {projectProgress.map((project) => {
                const growth = project.growth || [];

                const projectMastery =
                  growth.length > 0
                    ? Math.round(
                        growth.reduce(
                          (sum, item) => sum + (item.currentMastery || 0),
                          0,
                        ) / growth.length,
                      )
                    : 0;

                const projectAttention = growth.filter(
                  (item) => item.status === "Needs Attention",
                ).length;

                const projectImproving = growth.filter(
                  (item) => item.status === "Improving",
                ).length;

                return (
                  <div
                    className="progress-project-card"
                    key={project.projectId}
                  >
                    <div className="progress-project-header">
                      <div>
                        <h3>
                          {project.projectName ||
                            project.name ||
                            "Learning Project"}
                        </h3>

                        <p>
                          {growth.length} concept
                          {growth.length === 1 ? "" : "s"} tracked
                        </p>
                      </div>

                      <Link
                        to={`/projects/${project.projectId}`}
                        className="progress-project-button"
                      >
                        View Project →
                      </Link>
                    </div>

                    <div className="progress-project-mastery">
                      <div>
                        <span>Project Mastery</span>

                        <strong>{projectMastery}%</strong>
                      </div>

                      <div className="progress-project-track">
                        <div
                          className="progress-project-fill"
                          style={{
                            width: `${Math.min(projectMastery, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="progress-project-stats">
                      <span>📈 {projectImproving} Improving</span>

                      <span>🎯 {projectAttention} Needs Attention</span>
                    </div>

                    {growth.length > 0 && (
                      <div className="progress-project-concepts">
                        {growth.slice(0, 5).map((item) => (
                          <div
                            className="progress-concept-row"
                            key={item.conceptId}
                          >
                            <div>
                              <strong>{item.conceptName}</strong>

                              <span>{item.status}</span>
                            </div>

                            <strong>{item.currentMastery || 0}%</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Progress;
