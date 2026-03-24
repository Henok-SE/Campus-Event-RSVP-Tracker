import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // change when backend is ready
  headers: { 'Content-Type': 'application/json' }
});

export const getEvents = () => api.get('/events');
export const rsvpEvent = (eventId, userId) => api.post('/rsvp', { event_id: eventId, user_id: userId });
// Add more: createEvent, getMyRSVPs, checkIn, etc.

export default api;