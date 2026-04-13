// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock3, MapPin, Users } from 'lucide-react';
import DashboardNavbar from '../components/common/DashboardNavbar';
import Footer from '../components/common/Footer';
import { useDebounce } from '../hooks/useDebounce';
import { useNow } from '../hooks/useNow';
import { useAuth } from '../context/AuthContext';
import { getEvents, getMyRSVPs, rsvpEvent, cancelRsvp, getApiError } from '../services/api';
import { mapApiEvent } from '../utils/eventAdapter';
import { getLiveEventTiming } from '../utils/eventDateTime';

const DEFAULT_CATEGORIES = ['Sports', 'Arts', 'Academic', 'Social', 'Free Food', 'Tech'];
const RSVP_OPEN_STATUSES = new Set(['Published', 'Ongoing']);

const tagToneClass = (tag) => {
  const value = String(tag || '').toLowerCase();

  if (value.includes('free food')) {
    return 'bg-orange-500/90 text-white';
  }

  if (value.includes('academic')) {
    return 'bg-amber-500/90 text-white';
  }

  if (value.includes('arts')) {
    return 'bg-pink-500/90 text-white';
  }

  if (value.includes('tech')) {
    return 'bg-sky-500/90 text-white';
  }

  return 'bg-blue-600/90 text-white';
};

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
  const heroNowMs = useNow(1000);
  const listNowMs = useNow(60_000);

  const featuredEvents = useMemo(() => {
    const activeEvents = events.filter((event) => event.status !== 'Completed');

    if (activeEvents.length === 0) {
      return [];
    }

    const withImages = activeEvents.filter((event) => Boolean(event.image));
    const source = withImages.length > 0 ? withImages : activeEvents;
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
      if (event.status === 'Completed') {
        return false;
      }

      const matchesSearch = !term || 
        (event.title || '').toLowerCase().includes(term) ||
        (event.desc || '').toLowerCase().includes(term) ||
        (event.location || '').toLowerCase().includes(term) ||
        (event.tags || []).some((tag) => String(tag).toLowerCase().includes(term));

      const matchesCategory = activeCategory === 'All Events' || event.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [events, debouncedSearchTerm, activeCategory]);

  const formatSeatsLeft = (event) => {
    if (event.capacity > 0 && Number.isInteger(event.seatsLeft)) {
      return `${event.seatsLeft} seats left`;
    }

    return 'Open seats';
  };

  const getSeatFillPercent = (event) => {
    if (!event.capacity || event.capacity <= 0) {
      return 100;
    }

    return Math.min(100, Math.round((event.attending / event.capacity) * 100));
  };

  const featuredTiming = featured
    ? getLiveEventTiming({
      eventDate: featured.eventDateRaw,
      time: featured.time,
      durationMinutes: featured.durationMinutes,
      status: featured.status,
      nowMs: heroNowMs
    })
    : null;

  return (
    <>
      <DashboardNavbar rsvpCount={rsvpCount} />

      <div className="bg-white text-slate-900 min-h-screen">
        {/* Featured Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
          {featured ? (
            <div 
              className="bg-[#1E3A8A] text-white rounded-3xl overflow-hidden relative shadow-md"
              style={{ backgroundImage: `url('${featured.image}')`, backgroundSize: 'cover' }}
            >
              <div className="absolute inset-0 bg-linear-to-b from-black/40 to-black/70" />
              <div className="relative z-10 p-6 sm:p-8 md:p-10">
                <div className="flex flex-wrap gap-3 mb-5">
                  {featured.tags.map((tag, idx) => (
                    <span key={`${tag}-${idx}`} className="bg-white/20 px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight mb-4">{featured.title}</h1>
                <p className="text-base sm:text-lg md:text-xl leading-relaxed mb-6 max-w-3xl">{featured.desc}</p>
                <div className="flex flex-wrap gap-6 text-sm text-white/90 mb-8">
                  <div>📍 {featured.location}</div>
                  <div>👥 {featured.attending}{featured.capacity > 0 ? `/${featured.capacity}` : ''} attending</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="font-mono text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">{featuredTiming?.countdown ?? '-- : -- : --'}</div>
                  <Link to={`/event/${featured.id}`} className="bg-white text-[#1E3A8A] px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-100 transition-colors">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 text-slate-500 rounded-3xl p-10 text-center">
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
              className="w-full sm:flex-1 bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm sm:text-base focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors"
            />
            <div className="flex flex-wrap gap-3">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`cursor-pointer px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
                    activeCategory === cat ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid + My Schedule */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 grid lg:grid-cols-3 gap-8 items-start">
          <div className="order-2 lg:order-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-7">
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
              filteredEvents.map((event) => {
                const eventTiming = getLiveEventTiming({
                  eventDate: event.eventDateRaw,
                  time: event.time,
                  durationMinutes: event.durationMinutes,
                  status: event.status,
                  nowMs: listNowMs
                });

                return (
                  <div key={event.id} className="group bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="relative h-56 sm:h-60 overflow-hidden">
                    <img src={event.image} alt={event.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                    <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/25 to-black/50" />

                    <div className="absolute top-3 left-3 flex flex-wrap gap-2 pr-3">
                      {(event.tags || []).slice(0, 2).map((tag, idx) => (
                        <span key={`${tag}-${idx}`} className={`text-xs px-2.5 py-1 rounded-full font-semibold ${tagToneClass(tag)}`}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white flex items-center gap-1.5 backdrop-blur-sm">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{eventTiming.state === 'upcoming' ? `Starts in ${eventTiming.startsIn}` : eventTiming.startsIn}</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 bg-slate-50/60">
                    <h3 className="font-semibold text-xl sm:text-2xl mb-2.5 tracking-tight text-slate-900 line-clamp-2">{event.title}</h3>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4 line-clamp-2">{event.desc}</p>

                    <div className="mb-3 flex items-center gap-2 text-slate-600">
                      <MapPin className="h-4.5 w-4.5 shrink-0" />
                      <span className="text-sm sm:text-base font-medium line-clamp-1">{event.location}</span>
                    </div>

                    <div className="mb-2.5 flex items-center justify-between text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users className="h-4.5 w-4.5" />
                        <span className="text-sm sm:text-base font-medium">{event.attending}{event.capacity > 0 ? `/${event.capacity}` : ''}</span>
                      </div>
                      <span className="text-sm sm:text-base font-medium">{formatSeatsLeft(event)}</span>
                    </div>

                    <div className="mb-4 h-2 rounded-full bg-blue-100 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-blue-500 to-cyan-500"
                        style={{ width: `${getSeatFillPercent(event)}%` }}
                      />
                    </div>

                    <button
                      onClick={() => event.rsvpStatus !== 'rsvpd' && handleRSVPAction(event.id)}
                      disabled={event.rsvpStatus === 'rsvpd' || !isEventRsvpAvailable(event)}
                      className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${
                        event.rsvpStatus === 'rsvpd'
                          ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                          : !isEventRsvpAvailable(event)
                            ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-md cursor-pointer'
                      }`}
                    >
                      {event.rsvpStatus === 'rsvpd'
                        ? `RSVP'd${event.capacity > 0 ? ` · ${formatSeatsLeft(event)}` : ''}`
                        : isEventRsvpAvailable(event)
                          ? `Count Me In${event.capacity > 0 ? ` · ${formatSeatsLeft(event)}` : ''}`
                          : 'RSVP Unavailable'}
                    </button>
                  </div>
                </div>
                );
              })
            )}
          </div>

          {/* My Schedule Sidebar */}
          <div className="order-1 lg:order-2 self-start h-fit border border-slate-200 bg-slate-50/70 rounded-3xl p-5 sm:p-6 lg:sticky lg:top-24 shadow-[0_10px_30px_rgba(15,23,42,0.08)] flex flex-col">
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-500">
                <Calendar className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">My Schedule</h3>
            </div>

            {mySchedule.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-slate-500">
                  <Calendar className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="text-2xl font-semibold tracking-tight text-slate-600">No events yet</p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                  Hit "Count Me In" to add events to your schedule!
                </p>
              </div>
            ) : (
              <div className="mt-1 space-y-2.5 text-sm">
                {mySchedule.map(id => {
                  const ev = events.find(e => e.id === id);

                  if (!ev) {
                    return null;
                  }

                  const scheduleTiming = getLiveEventTiming({
                    eventDate: ev.eventDateRaw,
                    time: ev.time,
                    durationMinutes: ev.durationMinutes,
                    status: ev.status,
                    nowMs: listNowMs
                  });

                  return (
                    <div key={id} className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 flex items-center justify-between group">
                      <div>
                        <p className="font-semibold text-[15px] text-slate-900">{ev.title}</p>
                        <p className="text-slate-500 text-xs">
                          {ev.location} • {scheduleTiming.state === 'upcoming'
                            ? `Starts in ${scheduleTiming.startsIn}`
                            : scheduleTiming.startsIn}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRSVPAction(ev.id)} 
                        className="cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all duration-200 rounded-full hover:bg-red-50"
                        title="Cancel RSVP"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}