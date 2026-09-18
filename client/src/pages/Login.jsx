import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(formData);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/home");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Navbar */}
      <header className="auth-navbar">
        <Link to="/login" className="brand">
          <span className="brand-icon">🧠</span>
          <span>StudyMate</span>
        </Link>

        <div>
          <span className="auth-nav-text">New to StudyMate?</span>

          <Link to="/signup" className="auth-nav-link">
            Create account
          </Link>
        </div>
      </header>

      {/* Login */}
      <main className="auth-content">
        <div className="auth-card">
          <h1 className="auth-heading">Welcome back 👋</h1>

          <p className="auth-description">
            Continue your learning journey from where you left off.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>

              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>

              <input
                className="form-input"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{" "}
            <Link to="/signup" className="auth-footer-link">
              Create one
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
