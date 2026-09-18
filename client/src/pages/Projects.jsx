import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProjects, createProject } from "../services/api";

function Projects() {
  const { spaceId } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [learningGoal, setLearningGoal] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load projects
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      try {
        const data = await getProjects(spaceId);

        if (!cancelled) {
          setProjects(data.projects);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();

    setError("");

    try {
      const data = await createProject({
        spaceId,
        name,
        description,
        learningGoal,
      });

      setProjects((currentProjects) => [data.project, ...currentProjects]);

      setName("");
      setDescription("");
      setLearningGoal("");
      setShowForm(false);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="dashboard">
      {/* ================= SIDEBAR ================= */}

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

          <Link to="/spaces" className="sidebar-link active">
            <span>📚</span>
            <span>Learning Spaces</span>
          </Link>

          <Link to="/home" className="sidebar-link">
            <span>📊</span>
            <span>Progress</span>
          </Link>

          <Link to="/home" className="sidebar-link">
            <span>🤖</span>
            <span>AI Tutor</span>
          </Link>

          <Link to="/home" className="sidebar-link">
            <span>📝</span>
            <span>Assessments</span>
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="sidebar-link sidebar-button"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
          >
            <span>↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main className="dashboard-main">
        <Link to="/spaces" className="back-link">
          ← Learning Spaces
        </Link>

        <header className="page-header project-page-header">
          <div>
            <p className="dashboard-label">LEARNING SPACE</p>

            <h1>Your Projects</h1>

            <p className="page-description">
              Focused learning journeys inside this space.
            </p>
          </div>

          <button
            className="create-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ New Project"}
          </button>
        </header>

        {/* ================= CREATE PROJECT ================= */}

        {showForm && (
          <div className="form-card">
            <div className="form-card-header">
              <p className="section-eyebrow">NEW LEARNING JOURNEY</p>

              <h2>Create a project</h2>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project name</label>

                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Digital IC Design"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>

                <input
                  className="form-input"
                  type="text"
                  placeholder="What is this project about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Learning goal</label>

                <textarea
                  className="form-input project-textarea"
                  placeholder="What do you want to understand or achieve?"
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="primary-button form-submit">
                Create Project →
              </button>
            </form>
          </div>
        )}

        {error && <div className="page-error">{error}</div>}

        {/* ================= PROJECTS ================= */}

        {loading ? (
          <div className="empty-card">
            <div className="loading-dot">●</div>
            <p>Loading your projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon">🧩</div>

            <h2>No projects yet</h2>

            <p>Create a focused learning journey for this space.</p>

            <button className="create-button" onClick={() => setShowForm(true)}>
              + Create your first project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project, index) => (
              <div
                key={project._id}
                className="project-card"
                onClick={() => navigate(`/projects/${project._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate(`/projects/${project._id}`);
                  }
                }}
              >
                <div className="project-card-top">
                  <div className="project-icon">
                    {index % 3 === 0 ? "📘" : index % 3 === 1 ? "⚙️" : "🧠"}
                  </div>

                  <span className="project-status">ACTIVE</span>
                </div>

                <h2>{project.name}</h2>

                <p className="project-description">
                  {project.description || "A focused learning journey."}
                </p>

                <div className="goal-box">
                  <span>LEARNING GOAL</span>

                  <p>{project.learningGoal}</p>
                </div>

                <div className="project-footer">
                  <span>Materials &nbsp;•&nbsp; Tutor &nbsp;•&nbsp; Quiz</span>

                  <span className="project-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Projects;
