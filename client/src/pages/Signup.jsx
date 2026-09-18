import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../services/api";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
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
      const data = await signupUser(formData);

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
          <span className="auth-nav-text">Already have an account?</span>

          <Link to="/login" className="auth-nav-link">
            Sign in
          </Link>
        </div>
      </header>

      {/* Signup */}
      <main className="auth-content">
        <div className="auth-card">
          <h1 className="auth-heading">Start learning smarter 🚀</h1>

          <p className="auth-description">
            Create your learning workspace and let your AI companion help you
            grow.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Name</label>

              <input
                className="form-input"
                type="text"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

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
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account →"}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-footer-link">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Signup;
