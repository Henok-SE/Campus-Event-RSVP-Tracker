// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/common/DashboardNavbar';
import Footer from '../components/common/Footer';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { getEvents, getMyRSVPs, rsvpEvent, cancelRsvp, getApiError } from '../services/api';
import { mapApiEvent } from '../utils/eventAdapter';

const DEFAULT_CATEGORIES = ['Sports', 'Arts', 'Academic', 'Social', 'Free Food', 'Tech'];
const RSVP_OPEN_STATUSES = new Set(['Published', 'Ongoing']);

const isEventRsvpAvailable = (event) => {
  if (!event) {
    return false;
  }

  if (!RSVP_OPEN_STATUSES.has(event.status)) {
    return false;
  }

  if (Number.isInteger(event.capacity) && event.capacity > 0 && event.attending >= event.capacity) {
    return false;
  }

  return true;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [mySchedule, setMySchedule] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingEventId, setPendingEventId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Events');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const featuredEvents = useMemo(() => {
    if (events.length === 0) {
      return [];
    }

    const withImages = events.filter((event) => Boolean(event.image));
    const source = withImages.length > 0 ? withImages : events;
    return source.slice(0, 2);
  }, [events]);

  const featured = featuredEvents[currentSlide] || null;

  const categories = useMemo(() => {
    const dynamicCategories = events
      .flatMap((event) => [event.category, ...(event.tags || [])])
      .filter(Boolean);

    return ['All Events', ...new Set([...dynamicCategories, ...DEFAULT_CATEGORIES])];
  }, [events]);

  const applyLocalRsvpChange = (eventId, nextStatus) => {
    setEvents((prev) => prev.map((event) => {
      if (event.id !== eventId) {
        return event;
      }

      const delta = nextStatus === 'rsvpd' ? 1 : -1;
      const nextAttending = Math.max(0, (event.attending || 0) + delta);

      return {
        ...event,
        rsvpStatus: nextStatus,
        attending: nextAttending,
        seatsLeft: event.capacity > 0 ? Math.max(0, event.capacity - nextAttending) : null
      };
    }));

    setMySchedule((prev) => {
      if (nextStatus === 'rsvpd') {
        return [...new Set([...prev, eventId])];
      }

      return prev.filter((id) => id !== eventId);
    });

    setRsvpCount((prev) => {
      if (nextStatus === 'rsvpd') {
        return prev + 1;
      }

      return Math.max(0, prev - 1);
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const eventsResponse = await getEvents();
        const apiEvents = Array.isArray(eventsResponse?.data?.data)
          ? eventsResponse.data.data
          : [];

        let rsvpSet = new Set();

        if (isLoggedIn) {
          const myRsvpsResponse = await getMyRSVPs();
          const myRsvps = Array.isArray(myRsvpsResponse?.data?.data)
            ? myRsvpsResponse.data.data
            : [];

          rsvpSet = new Set(
            myRsvps
              .map((record) => record?.event?._id)
              .filter(Boolean)
              .map(String)
          );
        }

        const mappedEvents = apiEvents.map((event) => mapApiEvent(event, { rsvpSet }));
        const scheduleIds = mappedEvents
          .filter((event) => event.rsvpStatus === 'rsvpd')
          .map((event) => event.id);

        if (!isMounted) {
          return;
        }

        setEvents(mappedEvents);
        setMySchedule(scheduleIds);
        setRsvpCount(scheduleIds.length);
        setCurrentSlide(0);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const apiError = getApiError(error, 'Failed to load events');
        setErrorMessage(apiError.message);
        setEvents([]);
        setMySchedule([]);
        setRsvpCount(0);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  // Handle RSVP or Cancel RSVP
  const handleRSVPAction = async (eventId) => {
    const currentEvent = events.find((event) => event.id === eventId);

    if (!currentEvent || pendingEventId) {
      return;
    }

    if (currentEvent.rsvpStatus !== 'rsvpd' && !isEventRsvpAvailable(currentEvent)) {
      setErrorMessage('RSVP is unavailable until this event is published and has open spots.');
      return;
    }

    if (!isLoggedIn) {
      navigate('/login?redirect=/dashboard');
      return;
    }

    const nextStatus = currentEvent.rsvpStatus === 'rsvpd' ? 'available' : 'rsvpd';

    setErrorMessage('');
    setPendingEventId(eventId);

    // Optimistic update to keep UI responsive while request is in-flight.
    applyLocalRsvpChange(eventId, nextStatus);

    try {
      if (nextStatus === 'rsvpd') {
        await rsvpEvent(eventId);
      } else {
        await cancelRsvp(eventId);
      }
    } catch (error) {
      const apiError = getApiError(error, 'Failed to update RSVP');
      setErrorMessage(apiError.message);

      // Roll back optimistic change on failure.
      applyLocalRsvpChange(eventId, currentEvent.rsvpStatus);
    } finally {
      setPendingEventId(null);
    }
  };

  useEffect(() => {
    if (featuredEvents.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [featuredEvents]);

  useEffect(() => {
    if (currentSlide >= featuredEvents.length) {
      setCurrentSlide(0);
    }
  }, [currentSlide, featuredEvents.length]);

  const filteredEvents = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase().trim();
    return events.filter((event) => {
      const matchesSearch = !term || 
        (event.title || '').toLowerCase().includes(term) ||
        (event.desc || '').toLowerCase().includes(term) ||
        (event.location || '').toLowerCase().includes(term) ||
        (event.tags || []).some((tag) => String(tag).toLowerCase().includes(term));

      const matchesCategory = activeCategory === 'All Events' || event.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [events, debouncedSearchTerm, activeCategory]);

  return (
    <>
      <DashboardNavbar rsvpCount={rsvpCount} />

      <div className="bg-white text-slate-900 min-h-screen">
        {/* Featured Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
          {featured ? (
            <div 
              className="bg-[#1E3A8A] text-white rounded-3xl overflow-hidden relative shadow-lg"
              style={{ backgroundImage: `url('${featured.image}')`, backgroundSize: 'cover' }}
            >
              <div className="absolute inset-0 bg-linear-to-b from-black/40 to-black/70" />
              <div className="relative z-10 p-6 sm:p-10 md:p-12">
                <div className="flex flex-wrap gap-3 mb-5">
                  {featured.tags.map((tag, idx) => (
                    <span key={`${tag}-${idx}`} className="bg-white/20 px-4 py-1 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">{featured.title}</h1>
                <p className="text-base sm:text-lg md:text-xl mb-6 max-w-3xl">{featured.desc}</p>
                <div className="flex flex-wrap gap-6 text-sm mb-8">
                  <div>📍 {featured.location}</div>
                  <div>👥 {featured.attending}{featured.capacity > 0 ? `/${featured.capacity}` : ''} attending</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="font-mono text-4xl sm:text-5xl font-bold tabular-nums">{featured.countdown}</div>
                  <Link to={`/event/${featured.id}`} className="bg-white text-[#1E3A8A] px-8 py-4 rounded-2xl font-semibold hover:bg-slate-100 transition-all">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 text-slate-500 rounded-3xl p-12 text-center">
              No featured events yet.
            </div>
          )}
        </div>

        {/* Search + Categories */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-base focus:outline-none focus:border-blue-600"
            />
            <div className="flex flex-wrap gap-3">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-3 rounded-2xl text-sm font-medium transition-all ${
                    activeCategory === cat ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid + My Schedule */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {errorMessage ? (
              <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {loading ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                Loading events...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                No events found matching your search.
              </div>
            ) : (
              filteredEvents.map(event => (
                <div key={event.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-lg transition-all">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {event.tags.map((tag, idx) => (
                        <span key={`${tag}-${idx}`} className={`text-xs px-3 py-1 rounded-full ${
                          tag === "Free Food" ? "bg-orange-100 text-orange-700" :
                          tag === "Arts" ? "bg-pink-100 text-pink-700" :
                          tag === "Academic" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"
                        }`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="font-semibold text-lg sm:text-xl mb-2 line-clamp-2">{event.title}</h3>
                    <p className="text-slate-600 text-sm mb-6 line-clamp-3">{event.desc}</p>

                    <div className="flex justify-between text-xs text-slate-500 mb-6">
                      <div>📍 {event.location}</div>
                      <div>👥 {event.attending}{event.capacity > 0 ? `/${event.capacity}` : ''}</div>
                    </div>

                    <div className="text-xs text-slate-500 mb-6">⏳ Starts in {event.starts}</div>

                    <div className="flex gap-3">
                      <Link 
                        to={`/event/${event.id}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-medium text-center text-sm transition-all"
                      >
                        View Details
                      </Link>

                      <button
                        onClick={() => event.rsvpStatus !== "rsvpd" && handleRSVPAction(event.id)}
                        disabled={event.rsvpStatus === "rsvpd" || !isEventRsvpAvailable(event)}
                        className={`flex-1 py-3.5 rounded-2xl font-medium text-sm transition-all ${
                          event.rsvpStatus === "rsvpd" 
                            ? "bg-slate-100 text-slate-500 cursor-not-allowed" 
                            : !isEventRsvpAvailable(event)
                              ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {event.rsvpStatus === "rsvpd" ? "RSVP'd" : isEventRsvpAvailable(event) ? "Count Me In" : "RSVP Unavailable"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* My Schedule Sidebar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 h-fit lg:sticky lg:top-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📅</span>
              <h3 className="text-2xl font-semibold">My Schedule ({mySchedule.length})</h3>
            </div>

            {mySchedule.length === 0 ? (
              <p className="text-slate-500 text-sm leading-relaxed">
                No events yet.<br />Tap "Count Me In" to add events!
              </p>
            ) : (
              <div className="space-y-4 text-sm">
                {mySchedule.map(id => {
                  const ev = events.find(e => e.id === id);
                  return ev ? (
                    <div key={id} className="border-b pb-3 last:border-b-0 last:pb-0 flex items-center justify-between group">
                      <div>
                        <p className="font-medium">{ev.title}</p>
                        <p className="text-slate-500">{ev.location} • {ev.starts}</p>
                      </div>
                      <button 
                        onClick={() => handleRSVPAction(ev.id)} 
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                        title="Cancel RSVP"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}

            <Link 
              to="/create-event"
              className="mt-8 block w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-center text-sm transition-all"
            >
              Host an Event
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}