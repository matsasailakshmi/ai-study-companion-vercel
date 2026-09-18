import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Admin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Admin() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load admin dashboard");
        }

        setData(result);
      } catch (err) {
        console.error("Admin dashboard error:", err);

        if (err.message === "Admin access required") {
          navigate("/home");
          return;
        }

        setError(err.message || "Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboard();
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const formatActivityTime = (date) => {
    if (!date) {
      return "";
    }

    const activityDate = new Date(date);

    if (Number.isNaN(activityDate.getTime())) {
      return "";
    }

    return activityDate.toLocaleString();
  };

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
          <div className="admin-loading">Loading admin dashboard...</div>
        </main>
      </div>
    );
  }

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
          <div className="admin-error">
            <h2>Unable to load admin dashboard</h2>

            <p>{error}</p>

            <Link to="/home">Return to Home →</Link>
          </div>
        </main>
      </div>
    );
  }

  const statistics = data?.statistics || {};
  const users = data?.users || [];
  const activities = data?.recentActivities || [];

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

          <Link to="/progress" className="sidebar-link">
            <span>📊</span>
            <span>Progress</span>
          </Link>

          <Link to="/assessments" className="sidebar-link">
            <span>📝</span>
            <span>Assessments</span>
          </Link>

          <Link to="/profile" className="sidebar-link">
            <span>👤</span>
            <span>Profile</span>
          </Link>

          <Link to="/admin" className="sidebar-link active">
            <span>🛡️</span>
            <span>Admin</span>
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
        <header className="admin-page-header">
          <div>
            <p className="admin-eyebrow">ADMINISTRATION</p>

            <h1>Admin Dashboard</h1>

            <p>
              Monitor users, learning activity, projects, and platform usage.
            </p>
          </div>

          <div className="admin-badge">🛡️ ADMIN</div>
        </header>

        {/* =========================================
            STATISTICS
        ========================================= */}

        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">👥</div>

            <div>
              <span>Total Users</span>
              <strong>{statistics.totalUsers || 0}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">📚</div>

            <div>
              <span>Learning Spaces</span>
              <strong>{statistics.totalSpaces || 0}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">📁</div>

            <div>
              <span>Total Projects</span>
              <strong>{statistics.totalProjects || 0}</strong>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">⚡</div>

            <div>
              <span>Total Activities</span>
              <strong>{statistics.totalActivities || 0}</strong>
            </div>
          </div>
        </section>

        {/* =========================================
            USERS
        ========================================= */}

        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-eyebrow">PLATFORM USERS</p>

              <h2>Users</h2>

              <p>Recently registered StudyMate users.</p>
            </div>

            <span className="admin-count">{users.length}</span>
          </div>

          {users.length === 0 ? (
            <div className="admin-empty">No users found.</div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <strong>{user.name}</strong>
                      </td>

                      <td>{user.email}</td>

                      <td>
                        <span
                          className={
                            user.role === "admin"
                              ? "admin-role admin-role-admin"
                              : "admin-role"
                          }
                        >
                          {user.role}
                        </span>
                      </td>

                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =========================================
            RECENT ACTIVITY
        ========================================= */}

        <section className="admin-card">
          <div className="admin-card-header">
            <div>
              <p className="admin-eyebrow">PLATFORM ACTIVITY</p>

              <h2>Recent Activity</h2>

              <p>Latest learning events across the platform.</p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="admin-empty">No activity recorded yet.</div>
          ) : (
            <div className="admin-activity-list">
              {activities.map((activity) => (
                <div className="admin-activity-item" key={activity._id}>
                  <div className="admin-activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="admin-activity-content">
                    <strong>{activity.title}</strong>

                    <span>{activity.description || "Learning activity"}</span>

                    <small>
                      User: {activity.userId?.name || "Unknown user"}
                      {activity.projectId?.name
                        ? ` • Project: ${activity.projectId.name}`
                        : ""}
                    </small>
                  </div>

                  <time>{formatActivityTime(activity.createdAt)}</time>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Admin;
