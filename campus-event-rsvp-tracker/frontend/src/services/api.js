import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // change when backend is ready
  headers: { 'Content-Type': 'application/json' }
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

export const getEvents = () => api.get('/events');
export const getEventById = (eventId) => api.get(`/events/${eventId}`);
export const createEvent = (payload) => api.post('/events', payload);
export const updateEvent = (eventId, payload) => api.patch(`/events/${eventId}`, payload);
export const deleteEvent = (eventId) => api.delete(`/events/${eventId}`);

export const rsvpEvent = (eventId) => api.post('/rsvp', { event_id: eventId });
export const cancelRsvp = (eventId) => api.delete(`/rsvp/${eventId}`);
export const getMyRSVPs = () => api.get('/rsvp/my');

export default api;