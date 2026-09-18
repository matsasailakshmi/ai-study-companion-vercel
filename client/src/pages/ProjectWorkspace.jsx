import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import Materials from "../components/Materials";
import AITutor from "../components/AITutor";
import Quiz from "../components/Quiz";
import ConceptMastery from "../components/ConceptMastery";
import GrowthAnalysis from "../components/GrowthAnalysis";
import Recommendations from "../components/Recommendations";

import "./ProjectWorkspace.css";

const API_URL = "http://localhost:5000/api";

/*
  =========================================================
  ASSESSMENT PANEL
  =========================================================
*/

function AssessmentPanel({ projectId }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [result, setResult] = useState(null);

  const [loadingQuestion, setLoadingQuestion] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const getToken = () => {
    return localStorage.getItem("token");
  };

  /*
    Generate a new open-ended assessment question.
  */
  const generateAssessment = async () => {
    try {
      setLoadingQuestion(true);
      setError("");
      setResult(null);
      setAnswer("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/assessment/${projectId}/generate`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to generate assessment.");
      }

      setQuestion(data.question || "");
      setSources(data.sources || []);
    } catch (error) {
      console.error(error);

      setError(error.message || "Unable to generate assessment.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  /*
    Submit the student's open-ended answer.
  */
  const submitAssessment = async () => {
    if (!answer.trim()) {
      setError("Please write an answer first.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/assessment/${projectId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question,
            answer,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to evaluate assessment.");
      }

      setResult(data.assessment || data);
    } catch (error) {
      console.error(error);

      setError(error.message || "Unable to evaluate assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="workspace-content-card">
      <div className="workspace-section-header">
        <div>
          <p className="dashboard-label">OPEN-ENDED ASSESSMENT</p>

          <h2>Check Your Understanding</h2>

          <p className="page-description">
            Explain the concept in your own words. Your answer will be evaluated
            for accuracy, relevance, reasoning, and understanding.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={generateAssessment}
          disabled={loadingQuestion}
        >
          {loadingQuestion ? "Generating..." : "Generate Assessment"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {question && (
        <div className="assessment-question-card">
          <p className="assessment-label">QUESTION</p>

          <h3>{question}</h3>

          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Write your answer here..."
            rows={8}
            className="assessment-textarea"
            disabled={submitting}
          />

          <button
            type="button"
            className="primary-button"
            onClick={submitAssessment}
            disabled={submitting || !answer.trim()}
          >
            {submitting ? "Evaluating..." : "Submit Answer"}
          </button>
        </div>
      )}

      {sources.length > 0 && (
        <div className="assessment-sources">
          <h3>Sources</h3>

          {sources.map((source, index) => (
            <div key={`${source.chunkIndex}-${index}`} className="source-item">
              <strong>{source.sourceFileName || "Learning Material"}</strong>

              {source.pageNumber && <span> — Page {source.pageNumber}</span>}
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="assessment-result">
          <div className="assessment-score">
            <span>Score</span>

            <strong>{result.score ?? 0}%</strong>
          </div>

          {result.feedback && (
            <div className="assessment-feedback">
              <h3>Feedback</h3>

              <p>{result.feedback}</p>
            </div>
          )}

          {Array.isArray(result.understoodConcepts) &&
            result.understoodConcepts.length > 0 && (
              <div className="assessment-concepts">
                <h3>Understood Concepts</h3>

                <div className="concept-list">
                  {result.understoodConcepts.map((concept, index) => (
                    <span key={`${concept}-${index}`} className="concept-chip">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {Array.isArray(result.missingConcepts) &&
            result.missingConcepts.length > 0 && (
              <div className="assessment-concepts">
                <h3>Concepts to Review</h3>

                <div className="concept-list">
                  {result.missingConcepts.map((concept, index) => (
                    <span
                      key={`${concept}-${index}`}
                      className="concept-chip attention"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </section>
  );
}

/*
  =========================================================
  PROJECT WORKSPACE
  =========================================================
*/

function ProjectWorkspace() {
  const { projectId } = useParams();

  const [activeTab, setActiveTab] = useState("materials");

  /*
    Helper for sidebar navigation.
  */
  const openTab = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="dashboard">
      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">
        <Link to="/home" className="sidebar-brand">
          <span className="brand-icon">🧠</span>

          <span>StudyMate</span>
        </Link>

        <nav className="sidebar-nav">
          {/* Home */}

          <Link to="/home" className="sidebar-link">
            <span>🏠</span>
            <span>Home</span>
          </Link>

          {/* Learning Spaces */}

          <Link to="/spaces" className="sidebar-link">
            <span>📚</span>
            <span>Learning Spaces</span>
          </Link>

          {/* Progress */}

          <button
            type="button"
            className={`sidebar-link sidebar-button ${
              activeTab === "progress" ? "active" : ""
            }`}
            onClick={() => openTab("progress")}
          >
            <span>📊</span>
            <span>Progress</span>
          </button>

          {/* AI Tutor */}

          <button
            type="button"
            className={`sidebar-link sidebar-button ${
              activeTab === "tutor" ? "active" : ""
            }`}
            onClick={() => openTab("tutor")}
          >
            <span>🤖</span>
            <span>AI Tutor</span>
          </button>

          {/* Assessments */}

          <button
            type="button"
            className={`sidebar-link sidebar-button ${
              activeTab === "assessment" ? "active" : ""
            }`}
            onClick={() => openTab("assessment")}
          >
            <span>📝</span>
            <span>Assessments</span>
          </button>
        </nav>

        {/* =================================================
            LOGOUT
        ================================================= */}

        <div className="sidebar-bottom">
          <button
            type="button"
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

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="dashboard-main">
        <Link to="/spaces" className="back-link">
          ← Learning Spaces
        </Link>

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="page-header workspace-header">
          <div>
            <p className="dashboard-label">PROJECT WORKSPACE</p>

            <h1>Learning Workspace</h1>

            <p className="page-description">
              Your materials, AI Tutor, assessments, quizzes, and learning
              progress live here.
            </p>
          </div>
        </header>

        {/* =================================================
            WORKSPACE NAVIGATION
        ================================================= */}

        <div className="workspace-navigation">
          {/* Materials */}

          <button
            type="button"
            className={`workspace-tab ${
              activeTab === "materials" ? "active" : ""
            }`}
            onClick={() => openTab("materials")}
          >
            <span className="workspace-tab-icon">📚</span>

            <div>
              <strong>Materials</strong>

              <small>Knowledge base</small>
            </div>
          </button>

          {/* AI Tutor */}

          <button
            type="button"
            className={`workspace-tab ${activeTab === "tutor" ? "active" : ""}`}
            onClick={() => openTab("tutor")}
          >
            <span className="workspace-tab-icon">🤖</span>

            <div>
              <strong>AI Tutor</strong>

              <small>Ask questions</small>
            </div>
          </button>

          {/* Quiz */}

          <button
            type="button"
            className={`workspace-tab ${activeTab === "quiz" ? "active" : ""}`}
            onClick={() => openTab("quiz")}
          >
            <span className="workspace-tab-icon">📝</span>

            <div>
              <strong>Quiz</strong>

              <small>Test understanding</small>
            </div>
          </button>

          {/* Assessment */}

          <button
            type="button"
            className={`workspace-tab ${
              activeTab === "assessment" ? "active" : ""
            }`}
            onClick={() => openTab("assessment")}
          >
            <span className="workspace-tab-icon">✍️</span>

            <div>
              <strong>Assessment</strong>

              <small>Explain concepts</small>
            </div>
          </button>

          {/* Progress */}

          <button
            type="button"
            className={`workspace-tab ${
              activeTab === "progress" ? "active" : ""
            }`}
            onClick={() => openTab("progress")}
          >
            <span className="workspace-tab-icon">📊</span>

            <div>
              <strong>Progress</strong>

              <small>Mastery & growth</small>
            </div>
          </button>
        </div>

        {/* =================================================
            TAB CONTENT
        ================================================= */}

        {activeTab === "materials" && <Materials projectId={projectId} />}

        {activeTab === "tutor" && <AITutor projectId={projectId} />}

        {activeTab === "quiz" && <Quiz projectId={projectId} />}

        {activeTab === "assessment" && (
          <AssessmentPanel projectId={projectId} />
        )}

        {activeTab === "progress" && (
          <>
            <ConceptMastery projectId={projectId} />

            <GrowthAnalysis projectId={projectId} />

            <Recommendations projectId={projectId} />
          </>
        )}
      </main>
    </div>
  );
}

export default ProjectWorkspace;
