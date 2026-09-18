import { Link, useNavigate } from "react-router-dom";

import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const displayName = user.name || "Learner";
  const email = user.email || "No email available";

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

          <Link to="/profile" className="sidebar-link active">
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

      {/* ================= MAIN ================= */}

      <main className="dashboard-main">
        <header className="profile-page-header">
          <div>
            <p className="profile-eyebrow">ACCOUNT</p>

            <h1>Profile</h1>

            <p>View your StudyMate account information.</p>
          </div>
        </header>

        {/* ================= PROFILE CARD ================= */}

        <section className="profile-card">
          <div className="profile-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="profile-main-info">
            <h2>{displayName}</h2>
            <p>{email}</p>
          </div>
        </section>

        {/* ================= ACCOUNT INFORMATION ================= */}

        <section className="profile-section">
          <div className="profile-section-header">
            <div>
              <p className="profile-eyebrow">ACCOUNT INFORMATION</p>

              <h2>Your Details</h2>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail">
              <span>Name</span>
              <strong>{displayName}</strong>
            </div>

            <div className="profile-detail">
              <span>Email</span>
              <strong>{email}</strong>
            </div>

            <div className="profile-detail">
              <span>Account Type</span>
              <strong>Student</strong>
            </div>

            <div className="profile-detail">
              <span>Learning Platform</span>
              <strong>StudyMate</strong>
            </div>
          </div>
        </section>

        {/* ================= ACCOUNT ACTIONS ================= */}

        <section className="profile-section">
          <div className="profile-section-header">
            <div>
              <p className="profile-eyebrow">ACCOUNT ACTIONS</p>

              <h2>Manage Account</h2>
            </div>
          </div>

          <div className="profile-actions">
            <Link to="/home" className="profile-action-button">
              ← Back to Home
            </Link>

            <button className="profile-logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;
