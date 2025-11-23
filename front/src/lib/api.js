// Хелпер для запросов к API
const API_URL = '/api/v1';

export const fetcher = async (endpoint, options = {}) => {
    const token = localStorage.getItem('kb_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Токен протух
        localStorage.removeItem('kb_token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}`);
    }

    return response.json();
};