// src/pages/MySchedule.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/common/Footer';
import { Calendar, MapPin, Users, X } from 'lucide-react';
import BackButton from '../components/ui/BackButton';
import { cancelRsvp, getApiError, getMyRSVPs } from '../services/api';
import { mapMyRsvpRecord } from '../utils/eventAdapter';

export default function MySchedule() {
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingEventId, setPendingEventId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSchedule = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const response = await getMyRSVPs();
        const records = Array.isArray(response?.data?.data) ? response.data.data : [];
        const mapped = records.map((record) => mapMyRsvpRecord(record));

        if (!isMounted) {
          return;
        }

        setMyEvents(mapped);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const apiError = getApiError(error, 'Failed to load your schedule');
        setErrorMessage(apiError.message);
        setMyEvents([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCancelRSVP = async (eventId) => {
    if (!eventId || pendingEventId) {
      return;
    }

    const previousEvents = myEvents;

    setErrorMessage('');
    setPendingEventId(eventId);
    setMyEvents((prev) => prev.filter((ev) => ev.id !== eventId));

    try {
      await cancelRsvp(eventId);
    } catch (error) {
      const apiError = getApiError(error, 'Failed to cancel RSVP');
      setErrorMessage(apiError.message);
      setMyEvents(previousEvents);
    } finally {
      setPendingEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <div className="flex items-center justify-between mt-4">
            <h1 className="text-3xl font-bold">My Schedule</h1>
            <div className="text-sm text-slate-500">
              {myEvents.length} event{myEvents.length !== 1 ? 's' : ''} in your schedule
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {myEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
            <Calendar className="w-16 h-16 mx-auto text-slate-400 mb-6" />
            <h2 className="text-2xl font-semibold mb-4 text-slate-800">No events in your schedule</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              You haven't RSVP'd to any events yet.<br />
              Browse events and join something exciting.
            </p>
            <Link
              to="/events"
              className="inline-block bg-blue-600 text-white px-10 py-4 rounded-2xl font-medium hover:bg-blue-700 transition-colors"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {myEvents.map(ev => (
              <div 
                key={ev.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Event Image */}
                  <div 
                    className="sm:w-48 h-40 sm:h-40 rounded-2xl bg-cover bg-center shrink-0" 
                    style={{ backgroundImage: `url(${ev.image})` }} 
                  />

                  {/* Event Info */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-3">{ev.title}</h3>
                    
                    <div className="space-y-3 text-slate-600">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <span>{ev.date} • {ev.time}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-slate-400" />
                        <span>{ev.location}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-slate-400" />
                        <span>{ev.attending} / {ev.capacity} attending</span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex flex-col justify-between items-end">
                    <span
                      className={`inline-flex px-5 py-2 rounded-full text-sm font-medium ${
                        ev.status === 'Completed'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {ev.status === 'Completed' ? 'Completed' : 'Confirmed'}
                    </span>
                    
                    <button
                      onClick={() => handleCancelRSVP(ev.id)}
                      disabled={pendingEventId === ev.id}
                      className="mt-6 sm:mt-0 px-8 py-3 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors font-medium flex items-center gap-2"
                    >
                      <X size={18} /> {pendingEventId === ev.id ? 'Cancelling...' : 'Cancel RSVP'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}