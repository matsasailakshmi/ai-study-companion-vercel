import { useEffect, useState } from "react";
import {
  generateQuiz,
  saveQuizAttempt,
  getQuizAttempts,
} from "../services/api";

function Quiz({ projectId }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);

  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [finalResult, setFinalResult] = useState(null);
  const [attempts, setAttempts] = useState([]);

  /* =====================================================
     LOAD QUIZ HISTORY
  ===================================================== */

  useEffect(() => {
    const loadAttempts = async () => {
      try {
        const data = await getQuizAttempts(projectId);

        setAttempts(data.attempts || []);
      } catch (error) {
        console.error("Failed to load quiz attempts:", error);
      }
    };

    loadAttempts();
  }, [projectId]);

  /* =====================================================
     GENERATE QUIZ
  ===================================================== */

  const startQuiz = async () => {
    setLoading(true);
    setError("");

    setQuizFinished(false);
    setFinalResult(null);

    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);

    try {
      const data = await generateQuiz(projectId);

      setQuestions(data.questions || []);
      setQuizStarted(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     SELECT ANSWER
  ===================================================== */

  const handleAnswer = (answerIndex) => {
    if (saving) {
      return;
    }

    setSelectedAnswer(answerIndex);
  };

  /* =====================================================
     NEXT / SUBMIT
  ===================================================== */

  const handleNext = async () => {
    if (selectedAnswer === null || saving) {
      return;
    }

    const updatedAnswers = [...answers];

    updatedAnswers[currentQuestion] = selectedAnswer;

    setAnswers(updatedAnswers);

    /* -----------------------------------------------
       Final question
    ------------------------------------------------ */

    if (currentQuestion === questions.length - 1) {
      await submitQuiz(updatedAnswers);
      return;
    }

    /* -----------------------------------------------
       Move to next question
    ------------------------------------------------ */

    const nextQuestion = currentQuestion + 1;

    setCurrentQuestion(nextQuestion);

    setSelectedAnswer(updatedAnswers[nextQuestion] ?? null);
  };

  /* =====================================================
     SAVE QUIZ ATTEMPT
  ===================================================== */

  const submitQuiz = async (finalAnswers) => {
    setSaving(true);
    setError("");

    try {
      const data = await saveQuizAttempt(projectId, questions, finalAnswers);

      setFinalResult(data.attempt);

      setQuizFinished(true);

      /* -----------------------------------------------
         Refresh quiz history
      ------------------------------------------------ */

      try {
        const historyData = await getQuizAttempts(projectId);

        setAttempts(historyData.attempts || []);
      } catch (historyError) {
        console.error("Failed to refresh quiz history:", historyError);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  /* =====================================================
     LOADING QUIZ
  ===================================================== */

  if (loading) {
    return (
      <div className="quiz-container">
        <div className="quiz-loading">
          <div className="quiz-loading-icon">🧠</div>

          <h2>Generating your quiz...</h2>

          <p>Gemini is creating questions from your project materials.</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     SAVING RESULT
  ===================================================== */

  if (saving) {
    return (
      <div className="quiz-container">
        <div className="quiz-loading">
          <div className="quiz-loading-icon">💾</div>

          <h2>Saving your results...</h2>

          <p>Your quiz performance is being recorded.</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     QUIZ RESULT
  ===================================================== */

  if (quizFinished && finalResult) {
    const score = finalResult.score;

    const totalQuestions = finalResult.totalQuestions;

    const percentage = finalResult.percentage;

    return (
      <div className="quiz-container">
        <div className="quiz-result">
          <div className="quiz-result-icon">🎯</div>

          <p className="quiz-result-label">QUIZ COMPLETED</p>

          <h2>
            {score} / {totalQuestions}
          </h2>

          <p>You scored {percentage}% on this quiz.</p>

          {/* Review */}

          <div className="quiz-review">
            {finalResult.questions.map((question, index) => {
              const isCorrect = question.isCorrect;

              return (
                <div
                  key={question._id || index}
                  className={`quiz-review-item ${
                    isCorrect ? "quiz-review-correct" : "quiz-review-wrong"
                  }`}
                >
                  <div className="quiz-review-header">
                    <strong>Question {index + 1}</strong>

                    <span>{isCorrect ? "✓ Correct" : "✕ Incorrect"}</span>
                  </div>

                  <p>{question.question}</p>

                  <div className="quiz-review-answer">
                    <strong>Your answer:</strong>{" "}
                    {question.selectedAnswer !== null
                      ? question.options[question.selectedAnswer]
                      : "Not answered"}
                  </div>

                  <div className="quiz-review-answer">
                    <strong>Correct answer:</strong>{" "}
                    {question.options[question.correctAnswer]}
                  </div>

                  <div className="quiz-review-explanation">
                    {question.explanation}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="quiz-primary-button"
            onClick={() => {
              setQuizFinished(false);
              setFinalResult(null);
              setQuizStarted(false);
            }}
          >
            Back to Quiz
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     QUIZ INTRO + HISTORY
  ===================================================== */

  if (!quizStarted) {
    return (
      <div className="quiz-container">
        {/* =================================================
            GENERATE QUIZ
        ================================================= */}

        <div className="quiz-intro">
          <div className="quiz-intro-icon">📝</div>

          <h2>Test Your Understanding</h2>

          <p>
            Take a short quiz generated from your project learning materials.
          </p>

          <div className="quiz-info">
            <div>
              <strong>5</strong>
              <span>Questions</span>
            </div>

            <div>
              <strong>MCQ</strong>
              <span>Question type</span>
            </div>

            <div>
              <strong>AI</strong>
              <span>Generated</span>
            </div>
          </div>

          <button className="quiz-primary-button" onClick={startQuiz}>
            Generate Quiz
          </button>
        </div>

        {/* =================================================
            ATTEMPT HISTORY
        ================================================= */}

        <div className="quiz-history">
          <div className="quiz-history-header">
            <div>
              <p className="quiz-label">LEARNING HISTORY</p>

              <h2>Previous Attempts</h2>
            </div>

            <span className="quiz-history-count">
              {attempts.length} {attempts.length === 1 ? "attempt" : "attempts"}
            </span>
          </div>

          {/* =================================================
              NO ATTEMPTS
          ================================================= */}

          {attempts.length === 0 ? (
            <div className="quiz-history-empty">
              <div className="quiz-history-empty-icon">📊</div>

              <h3>No quiz attempts yet</h3>

              <p>
                Complete your first quiz to start tracking your learning
                progress.
              </p>
            </div>
          ) : (
            /* =================================================
               ATTEMPT LIST
            ================================================= */

            <div className="quiz-history-list">
              {attempts.map((attempt, index) => {
                return (
                  <div className="quiz-history-card" key={attempt._id}>
                    {/* Score */}

                    <div className="quiz-history-score">
                      <strong>{attempt.percentage}%</strong>

                      <span>
                        {attempt.score} / {attempt.totalQuestions}
                      </span>
                    </div>

                    {/* Details */}

                    <div className="quiz-history-details">
                      <h3>Quiz Attempt {attempts.length - index}</h3>

                      <p>Completed {formatDate(attempt.completedAt)}</p>
                    </div>

                    {/* Status */}

                    <div
                      className={`quiz-history-status ${
                        attempt.percentage >= 70
                          ? "positive"
                          : attempt.percentage >= 40
                            ? "average"
                            : "attention"
                      }`}
                    >
                      {attempt.percentage >= 70
                        ? "Strong"
                        : attempt.percentage >= 40
                          ? "Developing"
                          : "Needs Review"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =====================================================
     SAFETY CHECK
  ===================================================== */

  const question = questions[currentQuestion];

  if (!question) {
    return null;
  }

  /* =====================================================
     ERROR DURING QUIZ
  ===================================================== */

  return (
    <div className="quiz-container">
      {error && (
        <div className="quiz-error">
          <p>{error}</p>
        </div>
      )}

      {/* =================================================
          QUIZ HEADER
      ================================================= */}

      <div className="quiz-header">
        <div>
          <p className="quiz-label">AI GENERATED QUIZ</p>

          <h2>Test Your Understanding</h2>
        </div>

        <div className="quiz-progress-text">
          {currentQuestion + 1} / {questions.length}
        </div>
      </div>

      {/* =================================================
          PROGRESS BAR
      ================================================= */}

      <div className="quiz-progress-bar">
        <div
          className="quiz-progress-fill"
          style={{
            width: `${((currentQuestion + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* =================================================
          QUESTION
      ================================================= */}

      <div className="quiz-question-card">
        <p className="quiz-question-number">QUESTION {currentQuestion + 1}</p>

        <h3>{question.question}</h3>

        {/* Options */}

        <div className="quiz-options">
          {question.options.map((option, index) => (
            <button
              key={index}
              type="button"
              className={`quiz-option ${
                selectedAnswer === index ? "selected" : ""
              }`}
              onClick={() => handleAnswer(index)}
            >
              <span className="quiz-option-letter">
                {String.fromCharCode(65 + index)}
              </span>

              <span>{option}</span>
            </button>
          ))}
        </div>

        {/* Next / Submit */}

        <button
          type="button"
          className="quiz-primary-button quiz-next-button"
          disabled={selectedAnswer === null}
          onClick={handleNext}
        >
          {currentQuestion === questions.length - 1
            ? "Submit Quiz"
            : "Next Question"}
        </button>
      </div>
    </div>
  );
}

export default Quiz;
