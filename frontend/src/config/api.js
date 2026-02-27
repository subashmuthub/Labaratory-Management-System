// frontend/src/config/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Check if we're in development mode with Vite proxy
const isDevelopment = import.meta.env.DEV;
const useProxy = isDevelopment && window.location.hostname === 'localhost';

export const apiConfig = {
    baseURL: useProxy ? '' : API_BASE_URL, // Use empty string for proxy, full URL for direct calls
    fullURL: API_BASE_URL, // Always available full URL for direct calls if needed
    getHeaders: () => ({
        'Content-Type': 'application/json'
    })
};

export const apiEndpoints = {
    equipment: `${apiConfig.baseURL}/api/equipment`,
    labs: `${apiConfig.baseURL}/api/labs`,
    auth: `${apiConfig.baseURL}/api/auth`
};