// API Configuration
export const API_BASE = 'http://localhost:3000/api';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || API_BASE_URL.replace(/^http/i, 'ws');

export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    ME: `${API_BASE_URL}/api/auth/me`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
};

// Cache configuration
export const CACHE_TTL_MS = 60_000;

// Helper function for auth headers
export function getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}
