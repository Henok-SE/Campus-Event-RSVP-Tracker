// src/pages/Events.jsx
import { useEffect, useMemo, useState } from 'react';
import EventCard from '../components/ui/EventCard';
import { getApiError, getEvents } from '../services/api';
import { mapApiEvent } from '../utils/eventAdapter';

const categories = ["All Events", "Sports", "Arts", "Academic", "Social", "Free Food", "Tech"];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Events");

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const response = await getEvents();
        const apiEvents = Array.isArray(response?.data?.data) ? response.data.data : [];

        const mapped = apiEvents.map((event) => mapApiEvent(event));

        if (!isMounted) {
          return;
        }

        setEvents(mapped);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const apiError = getApiError(error, 'Failed to load events');
        setErrorMessage(apiError.message);
        setEvents([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return events.filter((event) => {
      const matchesSearch = !term
        || event.title.toLowerCase().includes(term)
        || event.desc.toLowerCase().includes(term)
        || event.location.toLowerCase().includes(term)
        || event.tags.some((tag) => String(tag).toLowerCase().includes(term));
      const matchesCategory = activeCategory === "All Events" || event.tag === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, activeCategory]);

  return (
    <div className="bg-white min-h-screen">
      {/* Search & Filters */}
      <div className="sticky top-0 bg-white border-b z-40 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 rounded-2xl font-medium transition-all ${
                    activeCategory === cat 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-100 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">All Events ({filteredEvents.length})</h1>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="text-center text-slate-500 py-20">Loading events...</div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} ctaTo={`/event/${event.id}`} ctaLabel="View Details" />
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <p className="text-center text-2xl text-slate-400 py-20">No events found</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}