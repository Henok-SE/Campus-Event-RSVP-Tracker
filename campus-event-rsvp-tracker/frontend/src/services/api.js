import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api';
const SKIP_AUTH_HANDLER_KEY = 'skipGlobalUnauthorizedHandler';

let unauthorizedHandler = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const skipAuthHandler = Boolean(error?.config?.[SKIP_AUTH_HANDLER_KEY]);

    if (status === 401 && !skipAuthHandler && typeof unauthorizedHandler === 'function') {
      unauthorizedHandler(error);
    }

    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

export const clearAuthToken = () => {
  delete api.defaults.headers.common.Authorization;
};

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
};

export const getApiError = (error, fallbackMessage = 'Request failed') => {
  const code = error?.response?.data?.error?.code || 'REQUEST_FAILED';
  const message = error?.response?.data?.error?.message || fallbackMessage;

  return { code, message };
};

export const registerUser = (payload) => api.post('/auth/register', payload);
export const loginUser = (payload) => api.post('/auth/login', payload, { [SKIP_AUTH_HANDLER_KEY]: true });
export const getCurrentUser = () => api.get('/auth/me');
export const updateCurrentUser = (payload) => api.patch('/auth/me', payload);

export const getEvents = () => api.get('/events');
export const getEventById = (eventId) => api.get(`/events/${eventId}`);
export const createEvent = (payload) => api.post('/events', payload);
export const getAdminEventStats = () => api.get('/events/admin/stats');
export const getPendingReviewEvents = () => api.get('/events/review/pending');
export const reviewEventSubmission = (eventId, payload) => api.patch(`/events/${eventId}/review`, payload);
export const resubmitEventForReview = (eventId, payload) => api.patch(`/events/${eventId}/resubmit`, payload);
export const uploadEventImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);

  return api.post('/events/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const updateEvent = (eventId, payload) => api.patch(`/events/${eventId}`, payload);
export const deleteEvent = (eventId) => api.delete(`/events/${eventId}`);

export const rsvpEvent = (eventId) => api.post('/rsvp', { event_id: eventId });
export const cancelRsvp = (eventId) => api.delete(`/rsvp/${eventId}`);
export const getMyRSVPs = () => api.get('/rsvp/my');

export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (notificationId) => api.patch(`/notifications/${notificationId}/read`);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all');
export const deleteNotification = (notificationId) => api.delete(`/notifications/${notificationId}`);

export default api;