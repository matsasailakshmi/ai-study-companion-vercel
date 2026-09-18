import { useState } from "react";
import { askTutor } from "../services/api";

function AITutor({ projectId }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async (e) => {
    e.preventDefault();

    if (!question.trim() || loading) {
      return;
    }

    const currentQuestion = question.trim();

    setQuestion("");
    setError("");

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: currentQuestion,
      },
    ]);

    setLoading(true);

    try {
      const data = await askTutor(projectId, currentQuestion);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
        },
      ]);
    } catch (error) {
      setError(error.message);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: "Sorry, I couldn't process your question. Please try again.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tutor">
      <div className="ai-tutor-header">
        <div>
          <h2>AI Tutor</h2>
          <p>Ask questions about your learning materials.</p>
        </div>

        <div className="tutor-status">
          <span className="status-dot"></span>
          Gemini
        </div>
      </div>

      <div className="tutor-messages">
        {messages.length === 0 && (
          <div className="tutor-empty">
            <div className="tutor-empty-icon">✦</div>

            <h3>How can I help you learn?</h3>

            <p>Ask a question about the materials in this project.</p>

            <div className="suggested-questions">
              <button
                type="button"
                onClick={() =>
                  setQuestion(
                    "What is the main concept explained in this material?",
                  )
                }
              >
                Explain the main concept
              </button>

              <button
                type="button"
                onClick={() =>
                  setQuestion(
                    "Give me a simple explanation of the important concepts.",
                  )
                }
              >
                Explain important concepts
              </button>

              <button
                type="button"
                onClick={() =>
                  setQuestion("What are the key points I should remember?")
                }
              >
                Give me key points
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`tutor-message ${
              message.role === "user"
                ? "tutor-user-message"
                : "tutor-ai-message"
            }`}
          >
            <div className="message-label">
              {message.role === "user" ? "You" : "AI Tutor"}
            </div>

            <div className="message-content">{message.content}</div>

            {message.role === "assistant" &&
              message.sources &&
              message.sources.length > 0 && (
                <div className="message-sources">
                  <div className="sources-title">Sources</div>

                  {message.sources.map((source, sourceIndex) => (
                    <div key={sourceIndex} className="source-item">
                      <span>📄</span>

                      <span>
                        {source.fileName}

                        {source.pageNumber
                          ? ` — Page ${source.pageNumber}`
                          : ` — Chunk ${source.chunkIndex}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        ))}

        {loading && (
          <div className="tutor-message tutor-ai-message">
            <div className="message-label">AI Tutor</div>

            <div className="tutor-loading">
              <span></span>
              <span></span>
              <span></span>
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {error && <div className="tutor-error">{error}</div>}

      <form className="tutor-input-area" onSubmit={handleAsk}>
        <input
          type="text"
          placeholder="Ask your tutor anything about this project..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />

        <button type="submit" disabled={loading || !question.trim()}>
          {loading ? "..." : "Ask"}
        </button>
      </form>
    </div>
  );
}

export default AITutor;
