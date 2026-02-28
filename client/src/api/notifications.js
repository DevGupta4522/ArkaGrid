import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: `${BASE_URL}/notifications`,
    withCredentials: true,
});

export const notificationsAPI = {
    getAll: () => api.get('/'),
    getUnreadCount: () => api.get('/unread-count'),
    markAsRead: (id) => api.put(`/${id}/read`),
    markAllAsRead: () => api.put('/mark-all-read'),
};
