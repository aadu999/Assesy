import axios from 'axios';

// Dynamically determine the API base URL
function getApiBaseUrl() {
    // If VITE_API_URL is set (production build), use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Check if we're accessing via a Cloudflare tunnel
    const hostname = window.location.hostname;

    if (hostname.includes('trycloudflare.com')) {
        // We're on a Cloudflare tunnel - need to use the backend tunnel URL
        // For now, try to get it from a meta tag or use relative path
        // The backend tunnel URL should be set by the start.sh script
        const backendUrl = document.querySelector('meta[name="backend-url"]')?.content;
        if (backendUrl) {
            return backendUrl;
        }
        // Fallback: assume backend is on same domain but different subdomain won't work
        // We need the actual backend tunnel URL
        // For tunnel mode, backend URL must be set via a config
        return window.BACKEND_URL || 'http://localhost:3000';
    }

    // Default for local development
    return 'http://localhost:3000';
}

const api = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // window.location.href = '/login'; // Handle redirect in AuthContext or Router
        }
        return Promise.reject(error);
    }
);

export default api;
