import { useEffect, useState } from "react";
import { getProjectConcepts } from "../services/api";

function ConceptMastery({ projectId }) {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadConcepts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProjectConcepts(projectId);

        setConcepts(data.concepts || []);
      } catch (error) {
        console.error("Failed to load concepts:", error);

        setError(error.message || "Failed to load concept mastery.");
      } finally {
        setLoading(false);
      }
    };

    loadConcepts();
  }, [projectId]);

  /* -----------------------------------------------
     Loading
  ------------------------------------------------ */

  if (loading) {
    return (
      <div className="concept-mastery-container">
        <div className="concept-mastery-card">
          <div className="concept-mastery-loading">
            Loading concept mastery...
          </div>
        </div>
      </div>
    );
  }

  /* -----------------------------------------------
     Error
  ------------------------------------------------ */

  if (error) {
    return (
      <div className="concept-mastery-container">
        <div className="concept-mastery-card">
          <div className="concept-mastery-error">{error}</div>
        </div>
      </div>
    );
  }

  /* -----------------------------------------------
     No concepts
  ------------------------------------------------ */

  if (concepts.length === 0) {
    return (
      <div className="concept-mastery-container">
        <div className="concept-mastery-card">
          <div className="concept-mastery-empty">
            <div className="concept-empty-icon">🧠</div>

            <h3>No concepts yet</h3>

            <p>
              Generate concepts from your project learning material to start
              tracking mastery.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* -----------------------------------------------
     Calculate overall mastery
  ------------------------------------------------ */

  const totalMastery = concepts.reduce(
    (sum, concept) => sum + (concept.masteryScore || 0),
    0,
  );

  const overallMastery = Math.round(totalMastery / concepts.length);

  /* -----------------------------------------------
     Mastery label
  ------------------------------------------------ */

  const getMasteryLabel = (score) => {
    if (score >= 80) {
      return "Strong";
    }

    if (score >= 50) {
      return "Developing";
    }

    return "Needs Review";
  };

  return (
    <div className="concept-mastery-container">
      {/* =========================================
          HEADER
      ========================================= */}

      <div className="concept-mastery-header">
        <div>
          <p className="dashboard-label">LEARNING PROGRESS</p>

          <h2>Concept Mastery</h2>

          <p>See how well you understand the key concepts in this project.</p>
        </div>

        <div className="overall-mastery">
          <span>Overall Mastery</span>

          <strong>{overallMastery}%</strong>
        </div>
      </div>

      {/* =========================================
          CONCEPT LIST
      ========================================= */}

      <div className="concept-mastery-list">
        {concepts.map((concept) => {
          const score = concept.masteryScore || 0;

          return (
            <div className="concept-mastery-card" key={concept._id}>
              <div className="concept-card-top">
                <div>
                  <h3>{concept.name}</h3>

                  {concept.description && <p>{concept.description}</p>}
                </div>

                <div className="concept-score">{score}%</div>
              </div>

              {/* Progress bar */}

              <div className="concept-progress-track">
                <div
                  className="concept-progress-fill"
                  style={{
                    width: `${score}%`,
                  }}
                />
              </div>

              {/* Statistics */}

              <div className="concept-card-bottom">
                <span>{concept.attempts || 0} attempts</span>

                <span>{concept.correctAnswers || 0} correct</span>

                <span>{concept.incorrectAnswers || 0} incorrect</span>

                <span className="concept-status">{getMasteryLabel(score)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConceptMastery;
