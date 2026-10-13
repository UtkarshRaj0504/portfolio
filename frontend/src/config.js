// Central place for the handful of values that are specific to Utkarsh's
// portfolio. Edit these directly rather than hunting through components.

export const SITE = {
  name: "AskUtkarsh",
  tagline: "An interactive way to explore my work.",
  subtext: "Ask about my projects, skills, education, or experience.",
  // Shown as a small icon link in the header. Leave blank ("") to hide it.
  githubUrl: "https://github.com/UtkarshRaj0504",
};

// Falls back to the local FastAPI dev server. Override by setting
// VITE_API_URL in a .env file when deploying against a different backend.
export const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const QUICK_ACTIONS = [
  { id: "projects", label: "My Projects", prompt: "Tell me about your projects." },
  { id: "skills", label: "Technical Skills", prompt: "What are your technical skills?" },
  { id: "education", label: "Education", prompt: "What is your educational background?" },
  { id: "contact", label: "Contact Info", prompt: "How can I contact you?" },
];

// Served from /public/resume.pdf — drop the real file in that folder.
export const RESUME_PATH = "/resume.pdf";
