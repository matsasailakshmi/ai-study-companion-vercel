import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSpaces, createSpace } from "../services/api";

function Spaces() {
  const [spaces, setSpaces] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Load spaces
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    let cancelled = false;

    const loadSpaces = async () => {
      try {
        const data = await getSpaces();

        if (!cancelled) {
          setSpaces(data.spaces);
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

    loadSpaces();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateSpace = async (e) => {
    e.preventDefault();

    setError("");

    try {
      const data = await createSpace({
        name,
        description,
      });

      setSpaces((currentSpaces) => [data.space, ...currentSpaces]);

      setName("");
      setDescription("");
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
        <header className="page-header">
          <div>
            <p className="dashboard-label">YOUR LEARNING</p>

            <h1>Learning Spaces</h1>

            <p className="page-description">
              Organize your learning into focused areas.
            </p>
          </div>

          <button
            className="create-button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ New Space"}
          </button>
        </header>

        {/* ================= CREATE FORM ================= */}

        {showForm && (
          <div className="form-card">
            <div className="form-card-header">
              <div>
                <p className="section-eyebrow">NEW WORKSPACE</p>

                <h2>Create a learning space</h2>
              </div>
            </div>

            <form onSubmit={handleCreateSpace}>
              <div className="form-group">
                <label className="form-label">Space name</label>

                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. VLSI"
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
                  placeholder="What are you learning?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button type="submit" className="primary-button form-submit">
                Create Space →
              </button>
            </form>
          </div>
        )}

        {error && <div className="page-error">{error}</div>}

        {/* ================= SPACES ================= */}

        {loading ? (
          <div className="empty-card">
            <div className="loading-dot">●</div>
            <p>Loading your spaces...</p>
          </div>
        ) : spaces.length === 0 ? (
          <div className="empty-card">
            <div className="empty-icon">📚</div>

            <h2>No learning spaces yet</h2>

            <p>
              Create your first space to start organizing your learning journey.
            </p>

            <button className="create-button" onClick={() => setShowForm(true)}>
              + Create your first space
            </button>
          </div>
        ) : (
          <div className="spaces-grid">
            {spaces.map((space, index) => (
              <Link
                key={space._id}
                to={`/spaces/${space._id}`}
                className="space-card"
              >
                <div className="space-card-top">
                  <div className="space-icon">
                    {index % 3 === 0 ? "⚡" : index % 3 === 1 ? "🧠" : "📚"}
                  </div>

                  <span className="space-arrow">→</span>
                </div>

                <h2>{space.name}</h2>

                <p>
                  {space.description ||
                    "A focused learning space for your studies."}
                </p>

                <div className="space-footer">
                  <span>Open workspace</span>

                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Spaces;
