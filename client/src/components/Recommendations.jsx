import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Recommendations({ projectId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [nextAction, setNextAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/recommendations/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load recommendations");
        }

        setRecommendations(data.recommendations || []);

        setNextAction(data.nextAction || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchRecommendations();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="recommendations-state">
        <div className="loading-spinner"></div>
        <p>Analyzing your learning progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendations-state error-state">
        <h3>Unable to load recommendations</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div className="recommendations-state">
        <div className="empty-icon">🎯</div>
        <h3>No recommendations yet</h3>
        <p>
          Complete a quiz to generate personalized learning recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="recommendations-container">
      {/* =====================================
          NEXT ACTION
      ===================================== */}

      {nextAction && (
        <section className="next-action-card">
          <div className="next-action-label">
            <span className="next-action-icon">⚡</span>
            <span>WHAT SHOULD I DO NEXT?</span>
          </div>

          <h2>{nextAction.recommendation.title}</h2>

          <p className="next-action-description">
            {nextAction.recommendation.action}
          </p>

          <p className="next-action-reason">
            {nextAction.recommendation.reason}
          </p>

          <div className="next-action-meta">
            <span>
              Mastery: <strong>{nextAction.currentMastery}%</strong>
            </span>

            <span>
              Status: <strong>{nextAction.status}</strong>
            </span>
          </div>
        </section>
      )}

      {/* =====================================
          ALL RECOMMENDATIONS
      ===================================== */}

      <section className="recommendations-section">
        <div className="section-heading">
          <div>
            <h2>Learning Recommendations</h2>
            <p>Personalized actions based on your learning progress.</p>
          </div>
        </div>

        <div className="recommendations-grid">
          {recommendations.map((item) => (
            <div className="recommendation-card" key={item.conceptId}>
              <div className="recommendation-card-top">
                <div>
                  <h3>{item.conceptName}</h3>

                  <span
                    className={`recommendation-status ${item.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mastery-value">{item.currentMastery}%</div>
              </div>

              <div className="recommendation-progress">
                <div
                  className="recommendation-progress-fill"
                  style={{
                    width: `${Math.min(item.currentMastery || 0, 100)}%`,
                  }}
                ></div>
              </div>

              <div className="recommendation-content">
                <h4>{item.recommendation.title}</h4>

                <p>{item.recommendation.action}</p>

                <div className="recommendation-reason">
                  <strong>Why:</strong> {item.recommendation.reason}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Recommendations;
