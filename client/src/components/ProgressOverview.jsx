function ProgressOverview({ overallMastery = 0, attentionAreas = [] }) {
  return (
    <section className="progress-overview-section">
      {/* ================= OVERALL PROGRESS ================= */}

      <div className="overall-progress-card">
        <div className="progress-overview-header">
          <div>
            <p className="section-eyebrow">YOUR PROGRESS</p>

            <h2>Overall Mastery</h2>
          </div>

          <div className="overall-mastery-value">{overallMastery}%</div>
        </div>

        <div className="overall-progress-bar">
          <div
            className="overall-progress-fill"
            style={{
              width: `${Math.min(overallMastery, 100)}%`,
            }}
          />
        </div>

        <p className="overall-progress-description">
          Your overall mastery is calculated from the concepts you have learned
          across your projects.
        </p>
      </div>

      {/* ================= ATTENTION AREAS ================= */}

      <div className="attention-areas-card">
        <div className="progress-overview-header">
          <div>
            <p className="section-eyebrow">FOCUS AREAS</p>

            <h2>Areas Needing Attention</h2>
          </div>

          <span className="attention-count">{attentionAreas.length}</span>
        </div>

        {attentionAreas.length === 0 ? (
          <div className="attention-empty">
            <div className="attention-empty-icon">🎉</div>

            <div>
              <h3>You're doing well!</h3>

              <p>No concepts currently need special attention.</p>
            </div>
          </div>
        ) : (
          <div className="attention-list">
            {attentionAreas.slice(0, 5).map((area) => (
              <div
                className="attention-item"
                key={`${area.projectId}-${area.conceptId}`}
              >
                <div className="attention-item-icon">🎯</div>

                <div className="attention-item-content">
                  <strong>{area.conceptName}</strong>

                  <span>{area.projectName}</span>
                </div>

                <div className="attention-item-mastery">
                  <strong>{area.mastery}%</strong>

                  <span>mastery</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProgressOverview;
