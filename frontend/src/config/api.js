// API configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const API_ENDPOINTS = {
  auth: {
    me: `${API_BASE_URL}/api/auth/me`,
    login: `${API_BASE_URL}/api/auth/login`,
    signup: `${API_BASE_URL}/api/auth/signup`,
  }
};

export default API_BASE_URL;