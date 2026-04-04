import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

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

export const getApiError = (error, fallbackMessage = 'Request failed') => {
  const code = error?.response?.data?.error?.code || 'REQUEST_FAILED';
  const message = error?.response?.data?.error?.message || fallbackMessage;

  return { code, message };
};

export const registerUser = (payload) => api.post('/auth/register', payload);
export const loginUser = (payload) => api.post('/auth/login', payload);
export const getCurrentUser = () => api.get('/auth/me');

export const getEvents = () => api.get('/events');
export const getEventById = (eventId) => api.get(`/events/${eventId}`);
export const createEvent = (payload) => api.post('/events', payload);
export const updateEvent = (eventId, payload) => api.patch(`/events/${eventId}`, payload);
export const deleteEvent = (eventId) => api.delete(`/events/${eventId}`);

export const rsvpEvent = (eventId) => api.post('/rsvp', { event_id: eventId });
export const cancelRsvp = (eventId) => api.delete(`/rsvp/${eventId}`);
export const getMyRSVPs = () => api.get('/rsvp/my');

export default api;