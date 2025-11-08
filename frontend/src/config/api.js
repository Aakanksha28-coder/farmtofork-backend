// Centralized API base configuration
// Priority: use REACT_APP_API_BASE_URL if provided.
// Fallbacks: localhost for dev, production-safe default for Vercel, else relative "/api".

const envBase = process.env.REACT_APP_API_BASE_URL;
let API_BASE_URL;

if (envBase && typeof envBase === 'string' && envBase.trim()) {
  API_BASE_URL = envBase.trim();
} else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  API_BASE_URL = 'http://localhost:5000/api';
} else if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  const isVercelHost = host.endsWith('vercel.app');
  const isFrontendProd = host.includes('farmtofork-frontend.vercel.app') || isVercelHost;
  if (isFrontendProd) {
    // Default to deployed backend on Vercel when env var is missing
    API_BASE_URL = 'https://farmtofork-backend.vercel.app/api';
  } else {
    // When frontend and backend share the same domain (e.g., via platform routing),
    // relative "/api" works without hardcoding a separate host.
    API_BASE_URL = '/api';
  }
} else {
  API_BASE_URL = '/api';
}

// Helpful companion: origin without the trailing "/api" segment
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export { API_BASE_URL, API_ORIGIN };