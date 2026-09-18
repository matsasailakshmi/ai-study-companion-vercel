import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const GrowthAnalysis = ({ projectId }) => {
  const [growth, setGrowth] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGrowth = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/growth/${projectId}`, {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load growth analysis");
        }

        setGrowth(data.growth || []);
      } catch (error) {
        console.error("Growth analysis error:", error);

        setError(error.message || "Failed to load growth analysis");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchGrowth();
    }
  }, [projectId]);

  /* ---------------------------------------------
     Loading
  --------------------------------------------- */

  if (loading) {
    return (
      <div className="growth-container">
        <div className="growth-header">
          <div>
            <p className="section-eyebrow">LEARNING INSIGHTS</p>

            <h2>Growth Analysis</h2>

            <p>Analyzing your learning progress...</p>
          </div>
        </div>

        <div className="growth-loading">Loading growth data...</div>
      </div>
    );
  }

  /* ---------------------------------------------
     Error
  --------------------------------------------- */

  if (error) {
    return (
      <div className="growth-container">
        <div className="growth-header">
          <div>
            <p className="section-eyebrow">LEARNING INSIGHTS</p>

            <h2>Growth Analysis</h2>
          </div>
        </div>

        <div className="growth-error">{error}</div>
      </div>
    );
  }

  /* ---------------------------------------------
     Empty state
  --------------------------------------------- */

  if (growth.length === 0) {
    return (
      <div className="growth-container">
        <div className="growth-header">
          <div>
            <p className="section-eyebrow">LEARNING INSIGHTS</p>

            <h2>Growth Analysis</h2>

            <p>
              Track how your understanding changes as you continue learning.
            </p>
          </div>
        </div>

        <div className="growth-empty">
          <div className="growth-empty-icon">↑</div>

          <h3>No growth data yet</h3>

          <p>Complete a quiz to start building your learning growth history.</p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------
     Summary calculations
  --------------------------------------------- */

  const improvingCount = growth.filter(
    (item) => item.status === "Improving",
  ).length;

  const stableCount = growth.filter((item) => item.status === "Stable").length;

  const attentionCount = growth.filter(
    (item) => item.status === "Needs Attention",
  ).length;

  const totalMastery = growth.reduce(
    (sum, item) => sum + (item.currentMastery || 0),
    0,
  );

  const overallMastery =
    growth.length > 0 ? Math.round(totalMastery / growth.length) : 0;

  const totalRecentAccuracy = growth.reduce(
    (sum, item) => sum + (item.recentAccuracy || 0),
    0,
  );

  const overallRecentAccuracy =
    growth.length > 0 ? Math.round(totalRecentAccuracy / growth.length) : 0;

  return (
    <div className="growth-container">
      {/* =========================================
          HEADER
      ========================================= */}

      <div className="growth-header">
        <div>
          <p className="section-eyebrow">LEARNING INSIGHTS</p>

          <h2>Growth Analysis</h2>

          <p>Understand how your learning performance is changing over time.</p>
        </div>
      </div>

      {/* =========================================
          SUMMARY CARDS
      ========================================= */}

      <div className="growth-summary-grid">
        <div className="growth-summary-card">
          <span>Overall Mastery</span>

          <strong>{overallMastery}%</strong>

          <small>Across all concepts</small>
        </div>

        <div className="growth-summary-card">
          <span>Recent Accuracy</span>

          <strong>{overallRecentAccuracy}%</strong>

          <small>Based on recent performance</small>
        </div>

        <div className="growth-summary-card">
          <span>Improving</span>

          <strong>{improvingCount}</strong>

          <small>Concepts showing progress</small>
        </div>

        <div className="growth-summary-card">
          <span>Needs Attention</span>

          <strong>{attentionCount}</strong>

          <small>Concepts to review</small>
        </div>
      </div>

      {/* =========================================
          STATUS OVERVIEW
      ========================================= */}

      <div className="growth-status-overview">
        <div className="growth-status-title">
          <div>
            <h3>Learning Status</h3>

            <p>Current growth across your concepts</p>
          </div>
        </div>

        <div className="growth-status-grid">
          <div className="growth-status-item">
            <div className="growth-status-dot improving"></div>

            <div>
              <strong>{improvingCount}</strong>

              <span>Improving</span>
            </div>
          </div>

          <div className="growth-status-item">
            <div className="growth-status-dot stable"></div>

            <div>
              <strong>{stableCount}</strong>

              <span>Stable</span>
            </div>
          </div>

          <div className="growth-status-item">
            <div className="growth-status-dot attention"></div>

            <div>
              <strong>{attentionCount}</strong>

              <span>Needs Attention</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          CONCEPT GROWTH
      ========================================= */}

      <div className="growth-concepts-section">
        <div className="growth-section-heading">
          <div>
            <h3>Concept Growth</h3>

            <p>See how your understanding is changing for each concept.</p>
          </div>
        </div>

        <div className="growth-concept-list">
          {growth.map((item) => (
            <div className="growth-concept-card" key={item.conceptId}>
              {/* Concept information */}

              <div className="growth-concept-main">
                <div>
                  <h4>{item.conceptName}</h4>

                  {item.description && <p>{item.description}</p>}
                </div>

                <span
                  className={`growth-badge ${
                    item.status === "Improving"
                      ? "improving"
                      : item.status === "Needs Attention"
                        ? "attention"
                        : "stable"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Mastery */}

              <div className="growth-mastery-row">
                <div className="growth-mastery-label">
                  <span>Mastery</span>

                  <strong>{item.currentMastery}%</strong>
                </div>

                <div className="growth-progress-track">
                  <div
                    className="growth-progress-fill"
                    style={{
                      width: `${item.currentMastery}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Performance information */}

              <div className="growth-metrics">
                <div>
                  <span>Recent Accuracy</span>

                  <strong>{item.recentAccuracy}%</strong>
                </div>

                <div>
                  <span>Previous Accuracy</span>

                  <strong>
                    {item.previousAccuracy !== null
                      ? `${item.previousAccuracy}%`
                      : "Not enough data"}
                  </strong>
                </div>

                <div>
                  <span>Change</span>

                  <strong
                    className={
                      item.accuracyChange > 0
                        ? "metric-positive"
                        : item.accuracyChange < 0
                          ? "metric-negative"
                          : ""
                    }
                  >
                    {item.accuracyChange !== null
                      ? `${
                          item.accuracyChange > 0 ? "+" : ""
                        }${item.accuracyChange}%`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>Attempts</span>

                  <strong>{item.totalAttempts}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GrowthAnalysis;
