import { useEffect, useRef, useState } from "react";
import { getMaterials, uploadMaterial } from "../services/api";
import "./Materials.css";

function Materials({ projectId }) {
  const [materials, setMaterials] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  // ==========================================
  // FETCH MATERIALS
  // ==========================================

  const fetchMaterials = async () => {
    try {
      const data = await getMaterials(projectId);

      setMaterials(data.materials || []);

      return data.materials || [];
    } catch (err) {
      setError(err.message || "Failed to load materials");

      return [];
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    let cancelled = false;

    const loadInitialMaterials = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMaterials(projectId);

        if (!cancelled) {
          setMaterials(data.materials || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load materials");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInitialMaterials();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ==========================================
  // AUTOMATIC STATUS POLLING
  // ==========================================

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    const checkProcessingStatus = async () => {
      try {
        const data = await getMaterials(projectId);

        if (cancelled) {
          return;
        }

        const latestMaterials = data.materials || [];

        setMaterials(latestMaterials);

        // Check whether anything is still being processed
        const hasPendingMaterials = latestMaterials.some(
          (material) =>
            material.status === "queued" || material.status === "processing",
        );

        // Stop polling when everything is finished
        if (!hasPendingMaterials && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Material polling error:", err.message);
        }
      }
    };

    // Start checking every 2 seconds
    intervalId = setInterval(checkProcessingStatus, 2000);

    return () => {
      cancelled = true;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [projectId]);

  // ==========================================
  // FILE SELECTION
  // ==========================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Check PDF
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      setSelectedFile(null);
      return;
    }

    // Check 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      setError("PDF must be smaller than 10 MB.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  // ==========================================
  // UPLOAD
  // ==========================================

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file first.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      await uploadMaterial(projectId, selectedFile);

      // Clear selected file
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Immediately fetch latest materials
      await fetchMaterials();
    } catch (err) {
      setError(err.message || "Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    if (status === "ready") {
      return "material-status ready";
    }

    if (status === "processing") {
      return "material-status processing";
    }

    if (status === "failed") {
      return "material-status failed";
    }

    return "material-status queued";
  };

  // ==========================================
  // STATUS TEXT
  // ==========================================

  const getStatusText = (status) => {
    if (status === "ready") {
      return "Ready";
    }

    if (status === "processing") {
      return "Processing...";
    }

    if (status === "failed") {
      return "Failed";
    }

    return "Queued";
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <section className="materials-section">
      {/* =========================
          HEADER
      ========================= */}

      <div className="materials-header">
        <div>
          <div className="materials-eyebrow">KNOWLEDGE BASE</div>

          <h2>Learning Materials</h2>

          <p>Upload PDFs that your AI Tutor can use as learning evidence.</p>
        </div>

        <button
          className="material-add-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <span>+</span>

          {uploading ? "Uploading..." : "Add Learning Material"}
        </button>
      </div>

      {/* =========================
          HIDDEN FILE INPUT
      ========================= */}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* =========================
          SELECTED FILE
      ========================= */}

      {selectedFile && (
        <div className="selected-file-box">
          <div className="selected-file-info">
            <div className="selected-file-icon">📄</div>

            <div>
              <strong>{selectedFile.name}</strong>

              <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          </div>

          <div className="selected-file-actions">
            <button
              className="cancel-file-button"
              onClick={() => {
                setSelectedFile(null);

                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={uploading}
            >
              Cancel
            </button>

            <button
              className="upload-button"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload PDF"}
            </button>
          </div>
        </div>
      )}

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="material-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* =========================
          LOADING
      ========================= */}

      {loading ? (
        <div className="materials-loading">
          <div className="loading-spinner"></div>

          <span>Loading your materials...</span>
        </div>
      ) : materials.length === 0 ? (
        /* =========================
           EMPTY STATE
        ========================= */

        <div className="materials-empty">
          <div className="materials-empty-icon">📚</div>

          <h3>Your knowledge base is empty</h3>

          <p>
            Add lecture notes, textbooks, or other PDF learning material to
            begin.
          </p>

          <button
            className="empty-upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload your first PDF
          </button>
        </div>
      ) : (
        /* =========================
           MATERIAL LIST
        ========================= */

        <div className="materials-list">
          {materials.map((material) => (
            <div className="material-card" key={material._id}>
              {/* PDF ICON */}

              <div className="material-icon">
                <span>PDF</span>
              </div>

              {/* INFORMATION */}

              <div className="material-info">
                <h3>{material.fileName}</h3>

                <div className="material-meta">
                  {material.pageCount > 0 && (
                    <span>{material.pageCount} pages</span>
                  )}

                  {material.pageCount > 0 && (
                    <span className="material-dot">•</span>
                  )}

                  <span className={getStatusClass(material.status)}>
                    <span className="status-dot"></span>

                    {getStatusText(material.status)}
                  </span>
                </div>

                {/* PROCESSING MESSAGE */}

                {material.status === "processing" && (
                  <div className="processing-message">
                    Reading and processing your PDF...
                  </div>
                )}

                {/* QUEUED MESSAGE */}

                {material.status === "queued" && (
                  <div className="processing-message">
                    Waiting for the document processor...
                  </div>
                )}

                {/* FAILED MESSAGE */}

                {material.status === "failed" && material.error && (
                  <div className="material-error-text">{material.error}</div>
                )}
              </div>

              {/* ARROW */}

              <div className="material-arrow">→</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Materials;
