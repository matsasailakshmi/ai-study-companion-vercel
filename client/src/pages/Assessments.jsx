import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./Assessments.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Assessments() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");

  const [question, setQuestion] = useState("");
  const [sources, setSources] = useState([]);

  const [answer, setAnswer] = useState("");

  const [assessment, setAssessment] = useState(null);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  /* =========================================
     LOAD PROJECTS
  ========================================= */

  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoadingProjects(true);
        setError("");

        const response = await fetch(`${API_URL}/home`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load projects");
        }

        const projectList = data.data?.projects || [];

        setProjects(projectList);

        if (projectList.length > 0) {
          setSelectedProject(projectList[0]._id || projectList[0].projectId);
        }
      } catch (err) {
        console.error("Assessment projects error:", err);
        setError(err.message || "Failed to load projects");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [navigate, token]);

  /* =========================================
     GENERATE ASSESSMENT
  ========================================= */

  const generateAssessment = async () => {
    if (!selectedProject) {
      setError("Please select a project first.");
      return;
    }

    try {
      setGenerating(true);
      setError("");

      setQuestion("");
      setSources([]);
      setAnswer("");
      setAssessment(null);

      const response = await fetch(
        `${API_URL}/assessment/${selectedProject}/generate`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate assessment");
      }

      setQuestion(data.question || "");
      setSources(data.sources || []);
    } catch (err) {
      console.error("Generate assessment error:", err);
      setError(err.message || "Failed to generate assessment");
    } finally {
      setGenerating(false);
    }
  };

  /* =========================================
     SUBMIT ANSWER
  ========================================= */

  const submitAssessment = async () => {
    if (!selectedProject) {
      setError("Please select a project.");
      return;
    }

    if (!question) {
      setError("Generate an assessment question first.");
      return;
    }

    if (!answer.trim()) {
      setError("Please write an answer before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(
        `${API_URL}/assessment/${selectedProject}/submit`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            question,
            answer: answer.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to evaluate assessment");
      }

      setAssessment(data.assessment || null);
    } catch (err) {
      console.error("Submit assessment error:", err);
      setError(err.message || "Failed to evaluate assessment");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================
     RESET
  ========================================= */

  const startAnotherAssessment = () => {
    setQuestion("");
    setSources([]);
    setAnswer("");
    setAssessment(null);
    setError("");
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
     SCORE LABEL
  ========================================= */

  const getScoreLabel = (score) => {
    if (score >= 80) {
      return "Strong Understanding";
    }

    if (score >= 60) {
      return "Good Understanding";
    }

    if (score >= 40) {
      return "Partial Understanding";
    }

    return "Needs More Practice";
  };

  /* =========================================
     LOADING
  ========================================= */

  if (loadingProjects) {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <Link to="/home" className="sidebar-brand">
            <span className="brand-icon">🧠</span>
            <span>StudyMate</span>
          </Link>
        </aside>

        <main className="dashboard-main">
          <div className="assessment-loading">Loading assessments...</div>
        </main>
      </div>
    );
  }

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

          <Link to="/ai-tutor" className="sidebar-link">
            <span>🤖</span>
            <span>AI Tutor</span>
          </Link>

          <Link to="/assessments" className="sidebar-link active">
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
        <header className="assessment-page-header">
          <div>
            <p className="assessment-eyebrow">OPEN-ENDED ASSESSMENT</p>

            <h1>Test Your Understanding</h1>

            <p>
              Explain a concept in your own words and get personalized feedback.
            </p>
          </div>

          <div className="assessment-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
        </header>

        {/* =========================================
            PROJECT SELECTOR
        ========================================= */}

        <section className="assessment-card">
          <div className="assessment-card-heading">
            <div>
              <p className="assessment-eyebrow">SELECT PROJECT</p>

              <h2>Choose what you want to assess</h2>

              <p>
                The assessment will be based on the learning material in the
                selected project.
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="assessment-empty">
              <span>📚</span>

              <div>
                <strong>No projects available</strong>

                <p>
                  Create a learning project and add material before starting an
                  assessment.
                </p>

                <Link to="/spaces">Go to Learning Spaces →</Link>
              </div>
            </div>
          ) : (
            <div className="assessment-project-selector">
              <select
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
                disabled={generating || submitting}
              >
                {projects.map((project) => {
                  const projectId = project._id || project.projectId;

                  return (
                    <option key={projectId} value={projectId}>
                      {project.name || project.projectName}
                    </option>
                  );
                })}
              </select>

              <button
                className="assessment-generate-button"
                onClick={generateAssessment}
                disabled={generating || submitting}
              >
                {generating
                  ? "Generating..."
                  : question
                    ? "Generate New Question"
                    : "Generate Assessment"}
              </button>
            </div>
          )}
        </section>

        {/* =========================================
            ERROR
        ========================================= */}

        {error && <div className="assessment-error">{error}</div>}

        {/* =========================================
            QUESTION
        ========================================= */}

        {question && (
          <section className="assessment-card">
            <div className="assessment-question-header">
              <div>
                <p className="assessment-eyebrow">YOUR QUESTION</p>

                <h2>Explain what you understand</h2>
              </div>

              <span className="assessment-question-badge">OPEN ENDED</span>
            </div>

            <div className="assessment-question">{question}</div>

            {/* Sources */}

            {sources.length > 0 && (
              <div className="assessment-sources">
                <strong>Based on your project material</strong>

                <div className="assessment-source-list">
                  {sources.slice(0, 5).map((source, index) => (
                    <div
                      className="assessment-source"
                      key={`${source.materialId || index}-${index}`}
                    >
                      📄{" "}
                      {source.fileName || source.material || "Project material"}
                      {source.pageNumber ? ` — Page ${source.pageNumber}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Answer */}

            {!assessment && (
              <div className="assessment-answer-section">
                <label htmlFor="assessment-answer">Your Answer</label>

                <textarea
                  id="assessment-answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Explain the concept in your own words..."
                  rows={9}
                  disabled={submitting}
                />

                <div className="assessment-answer-footer">
                  <span>{answer.trim().length} characters</span>

                  <button
                    className="assessment-submit-button"
                    onClick={submitAssessment}
                    disabled={submitting || !answer.trim()}
                  >
                    {submitting ? "Evaluating..." : "Submit Answer →"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* =========================================
            RESULT
        ========================================= */}

        {assessment && (
          <section className="assessment-result-card">
            <div className="assessment-result-header">
              <div>
                <p className="assessment-eyebrow">ASSESSMENT RESULT</p>

                <h2>Your Understanding</h2>
              </div>

              <div className="assessment-score">
                <strong>{assessment.score ?? 0}</strong>

                <span>/ 100</span>
              </div>
            </div>

            <div className="assessment-score-label">
              {getScoreLabel(assessment.score ?? 0)}
            </div>

            {/* Evaluation breakdown */}

            <div className="assessment-evaluation-grid">
              <div>
                <span>Accuracy</span>

                <strong>{assessment.accuracy ?? 0}%</strong>
              </div>

              <div>
                <span>Relevance</span>

                <strong>{assessment.relevance ?? 0}%</strong>
              </div>

              <div>
                <span>Reasoning</span>

                <strong>{assessment.reasoning ?? 0}%</strong>
              </div>
            </div>

            {/* Feedback */}

            {assessment.feedback && (
              <div className="assessment-feedback">
                <p className="assessment-eyebrow">FEEDBACK</p>

                <h3>What you did well and what to improve</h3>

                <p>{assessment.feedback}</p>
              </div>
            )}

            {/* Understood concepts */}

            {assessment.understoodConcepts?.length > 0 && (
              <div className="assessment-concept-section">
                <h3>✓ Concepts You Understood</h3>

                <div className="assessment-tags">
                  {assessment.understoodConcepts.map((concept, index) => (
                    <span key={`${concept}-${index}`}>{concept}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing concepts */}

            {assessment.missingConcepts?.length > 0 && (
              <div className="assessment-concept-section">
                <h3>🎯 Concepts to Review</h3>

                <div className="assessment-tags missing">
                  {assessment.missingConcepts.map((concept, index) => (
                    <span key={`${concept}-${index}`}>{concept}</span>
                  ))}
                </div>
              </div>
            )}

            {/* New assessment */}

            <button
              className="assessment-new-button"
              onClick={startAnotherAssessment}
            >
              Take Another Assessment
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default Assessments;
