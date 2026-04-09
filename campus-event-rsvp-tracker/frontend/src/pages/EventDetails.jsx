// src/pages/EventDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Users, Clock } from 'lucide-react';
import Footer from '../components/common/Footer';
import { cancelRsvp, deleteEvent, getApiError, getEventById, getMyRSVPs, resubmitEventForReview, rsvpEvent } from '../services/api';
import { mapApiEvent } from '../utils/eventAdapter';

const RSVP_OPEN_STATUSES = new Set(['Published', 'Ongoing']);

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const [event, setEvent] = useState(null);
  const [rsvpStatus, setRsvpStatus] = useState('none'); // 'none' | 'confirmed'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionErrorMessage, setActionErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadEventDetails = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const eventResponse = await getEventById(id);
        const apiEvent = eventResponse?.data?.data;

        if (!apiEvent) {
          throw new Error('Event data is missing');
        }

        const eventId = String(apiEvent._id || apiEvent.id || '');
        let isRsvpd = false;

        if (isLoggedIn && eventId) {
          const myRsvpsResponse = await getMyRSVPs();
          const myRsvps = Array.isArray(myRsvpsResponse?.data?.data)
            ? myRsvpsResponse.data.data
            : [];

          isRsvpd = myRsvps.some((record) => String(record?.event?._id || '') === eventId);
        }

        const mappedEvent = mapApiEvent(apiEvent, {
          rsvpSet: isRsvpd && eventId ? new Set([eventId]) : new Set()
        });

        if (!isMounted) {
          return;
        }

        setEvent(mappedEvent);
        setRsvpStatus(isRsvpd ? 'confirmed' : 'none');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const apiError = getApiError(error, 'Failed to load event details');
        setErrorMessage(apiError.message);
        setEvent(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEventDetails();

    return () => {
      isMounted = false;
    };
  }, [id, isLoggedIn]);

  const applyLocalRsvpChange = (nextStatus) => {
    setRsvpStatus(nextStatus);
    setEvent((prev) => {
      if (!prev) {
        return prev;
      }

      const delta = nextStatus === 'confirmed' ? 1 : -1;
      const nextAttending = Math.max(0, (prev.attending || 0) + delta);

      return {
        ...prev,
        attending: nextAttending,
        seatsLeft: prev.capacity > 0 ? Math.max(0, prev.capacity - nextAttending) : null
      };
    });
  };

  const handleRSVPAction = async () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(`/event/${id}`)}`);
      return;
    }

    if (!event || actionLoading) {
      return;
    }

    const currentStatus = rsvpStatus;
    const nextStatus = currentStatus === 'confirmed' ? 'none' : 'confirmed';

    setActionErrorMessage('');
    setActionLoading(true);
    applyLocalRsvpChange(nextStatus);

    try {
      if (nextStatus === 'confirmed') {
        await rsvpEvent(event.id);
      } else {
        await cancelRsvp(event.id);
      }
    } catch (error) {
      applyLocalRsvpChange(currentStatus);
      const apiError = getApiError(error, 'Failed to update RSVP');
      setActionErrorMessage(apiError.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(`/event/${id}`)}`);
      return;
    }

    if (!event || deleteLoading) {
      return;
    }

    const confirmed = window.confirm('Delete this event permanently? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setActionErrorMessage('');
    setDeleteLoading(true);

    try {
      await deleteEvent(event.id);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const apiError = getApiError(error, 'Failed to delete event');
      setActionErrorMessage(apiError.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResubmit = async () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(`/event/${id}`)}`);
      return;
    }

    if (!event || resubmitLoading) {
      return;
    }

    setActionErrorMessage('');
    setResubmitLoading(true);

    try {
      const response = await resubmitEventForReview(event.id, {});
      const updatedEvent = response?.data?.data;

      if (updatedEvent) {
        setEvent(mapApiEvent(updatedEvent));
      }
    } catch (error) {
      const apiError = getApiError(error, 'Failed to resubmit event');
      setActionErrorMessage(apiError.message);
    } finally {
      setResubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Event not available</h1>
        {errorMessage ? <p className="mb-4 text-sm text-slate-600">{errorMessage}</p> : null}
        <Link to="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const isClosed = event.status === 'Cancelled' || event.status === 'Completed';
  const isFull = event.capacity > 0 && event.attending >= event.capacity;
  const isRsvpOpenStatus = RSVP_OPEN_STATUSES.has(event.status);
  const canRSVP = rsvpStatus === 'none' && !isFull && !isClosed && isRsvpOpenStatus;
  const isConfirmed = rsvpStatus === 'confirmed';
  const isOwner = Boolean(user?.id && event?.createdBy && String(user.id) === String(event.createdBy));
  const canResubmit = isOwner && event.status === 'Rejected';

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        {/* Hero Card */}
        <div className="bg-white rounded-3xl shadow overflow-hidden mb-12 border border-gray-200">
          {event.image && (
            <div 
              className="h-64 sm:h-80 md:h-105 bg-cover bg-center"
              style={{ backgroundImage: `url(${event.image})` }}
            />
          )}

          <div className="p-6 sm:p-10 md:p-12">
            <div className="flex flex-wrap gap-3 mb-6">
              {event.tags.map(tag => (
                <span 
                  key={tag}
                  className="inline-flex px-4 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
              {!isRsvpOpenStatus && (
                <span className="inline-flex px-4 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                  {event.status}
                </span>
              )}
              {isFull && (
                <span className="inline-flex px-4 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Full
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">{event.title}</h1>
            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-10">{event.description}</p>

            {actionErrorMessage ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionErrorMessage}
              </div>
            ) : null}

            {event.rejectionReason ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span className="font-semibold">Review feedback:</span> {event.rejectionReason}
              </div>
            ) : null}

            <div className="grid sm:grid-cols-3 gap-8 text-sm mb-12">
              <div>
                <p className="text-gray-500 mb-1 flex items-center gap-2">
                  <Clock size={16} /> When
                </p>
                <p className="font-medium">{event.date}{event.time && event.time !== 'TBA' ? ` • ${event.time}` : ''}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1 flex items-center gap-2">
                  <MapPin size={16} /> Where
                </p>
                <p className="font-medium">📍 {event.location}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1 flex items-center gap-2">
                  <Users size={16} /> Spots
                </p>
                <p className="font-medium">
                  {event.attending} / {event.capacity} attending
                </p>
              </div>
            </div>

            {/* RSVP Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {isConfirmed ? (
                <div className="bg-green-100 text-green-800 px-10 py-5 rounded-2xl font-semibold flex items-center gap-3">
                  <span className="text-xl">✓</span> You're going!
                </div>
              ) : canRSVP ? (
                <button
                  onClick={handleRSVPAction}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-12 py-5 rounded-2xl font-semibold text-lg transition-all"
                >
                  {actionLoading ? 'Saving...' : 'Count Me In'}
                </button>
              ) : isClosed || !isRsvpOpenStatus ? (
                <div className="bg-slate-200 text-slate-700 px-10 py-5 rounded-2xl font-semibold">
                  RSVP unavailable for this event status
                </div>
              ) : null}

              {isConfirmed && (
                <button
                  onClick={handleRSVPAction}
                  disabled={actionLoading}
                  className="px-10 py-5 rounded-2xl font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-60 transition-colors"
                >
                  {actionLoading ? 'Saving...' : 'Cancel RSVP'}
                </button>
              )}

              {isOwner && (
                <button
                  onClick={handleDeleteEvent}
                  disabled={deleteLoading}
                  className="px-10 py-5 rounded-2xl font-medium text-red-700 border border-red-300 hover:bg-red-50 disabled:opacity-60 transition-colors"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Event'}
                </button>
              )}

              {canResubmit && (
                <button
                  onClick={handleResubmit}
                  disabled={resubmitLoading}
                  className="px-10 py-5 rounded-2xl font-medium text-amber-700 border border-amber-300 hover:bg-amber-50 disabled:opacity-60 transition-colors"
                >
                  {resubmitLoading ? 'Resubmitting...' : 'Resubmit For Review'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-200">
            <h3 className="text-2xl font-semibold mb-6">Event Details</h3>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-xl">🕒</span>
                <div>
                  <p className="font-medium">Duration</p>
                  <p>2 hours</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">🎟️</span>
                <div>
                  <p className="font-medium">Entry</p>
                  <p>Free for all students with valid ID</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">🍿</span>
                <div>
                  <p className="font-medium">Amenities</p>
                  <p>Free snacks & drinks provided</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-200">
            <h3 className="text-2xl font-semibold mb-6">Hosted by</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-2xl">
                R
              </div>
              <div>
                <p className="font-medium text-lg">{event.organizer || 'Recreation Department'}</p>
                <p className="text-gray-600">Official Campus Organization</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}