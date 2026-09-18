const API_URL = "http://localhost:5000/api";

// =========================
// AUTH
// =========================

export const signupUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Signup failed");
  }

  return data;
};

export const loginUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
};

// =========================
// SPACES
// =========================

export const getSpaces = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/spaces`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get spaces");
  }

  return data;
};

export const createSpace = async (spaceData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/spaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(spaceData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create space");
  }

  return data;
};

// =========================
// PROJECTS
// =========================

export const getProjects = async (spaceId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/projects/space/${spaceId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get projects");
  }

  return data;
};

export const getProjectConcepts = async (projectId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/concepts/${projectId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get project concepts");
  }

  return data;
};

export const createProject = async (projectData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(projectData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create project");
  }

  return data;
};

// =========================
// MATERIALS
// =========================

// Get all materials for a project
export const getMaterials = async (projectId) => {
  const token = localStorage.getItem("token");

  // Cache-busting timestamp
  const cacheBuster = Date.now();

  const response = await fetch(
    `${API_URL}/materials/${projectId}?t=${cacheBuster}`,
    {
      method: "GET",

      // Force browser to request fresh data
      cache: "no-store",

      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get materials");
  }

  return data;
};

// Upload PDF to a project
export const uploadMaterial = async (projectId, file) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${API_URL}/materials/${projectId}/upload`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${token}`,
    },

    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to upload material");
  }

  return data;
};

export const askTutor = async (projectId, question) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/tutor/${projectId}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      question,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to ask AI Tutor");
  }

  return data;
};

export const generateQuiz = async (projectId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/quiz/${projectId}/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to generate quiz");
  }

  return data;
};

export const saveQuizAttempt = async (projectId, questions, answers) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/quiz/${projectId}/attempt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      questions,
      answers,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to save quiz attempt");
  }

  return data;
};

export const getQuizAttempts = async (projectId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/quiz/${projectId}/attempts`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get quiz attempts");
  }

  return data;
};
