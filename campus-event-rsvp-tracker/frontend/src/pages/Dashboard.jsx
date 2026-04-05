// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashboardNavbar from '../components/common/DashboardNavbar';
import Footer from '../components/common/Footer';
import { useDebounce } from '../hooks/useDebounce';

const featuredEvents = [
  {
    id: 3,
    title: "Intramural Basketball Finals",
    desc: "Championship game between the Thunderbolts and the Pioneers. Bring your spirit!",
    location: "Recreation Center",
    attending: 256,
    capacity: 300,
    countdown: "00 : 56 : 10",
    tags: ["Sports"],
    image: "https://picsum.photos/id/1018/2000/1200",
    category: "Sports",
    rsvpStatus: "available"
  },
  {
    id: 1,
    title: "Spring Music Festival",
    desc: "Live performances from campus bands and special guest DJs...",
    location: "Main Quad",
    attending: 342,
    capacity: 500,
    countdown: "09 : 27 : 15",
    tags: ["Arts", "Free Food"],
    image: "https://picsum.photos/id/201/2000/1200",
    category: "Arts",
    rsvpStatus: "rsvpd"
  }
];

const bottomEventsInitial = [
  { id:4, title:"Pizza & Philosophy", tags:["Free Food"], desc:"This week's topic...", location:"Library Lounge", attending:28, capacity:40, starts:"2h 55m", seatsLeft:12, category:"Social", rsvpStatus:"available" },
  { id:5, title:"Resume Workshop", tags:["Academic"], desc:"Get your resume reviewed...", location:"Career Center", attending:31, capacity:50, starts:"7h 55m", seatsLeft:19, category:"Academic", rsvpStatus:"available" },
  { id:6, title:"Sunset Yoga on the Lawn", tags:["Social"], desc:"Unwind with a guided yoga...", location:"West Lawn", attending:45, capacity:60, starts:"3h 55m", seatsLeft:15, category:"Social", rsvpStatus:"available" },
  { id:7, title:"Open Mic Night", tags:["Arts"], desc:"Share your poetry, comedy, or music...", location:"Student Center Stage", attending:52, capacity:80, starts:"5h 55m", seatsLeft:28, category:"Arts", rsvpStatus:"available" },
  { id:8, title:"AI & Ethics Panel Discussion", tags:["Academic"], desc:"Faculty and industry experts discuss...", location:"Auditorium B", attending:134, capacity:200, starts:"11h 55m", seatsLeft:66, category:"Academic", rsvpStatus:"available" },
  { id:9, title:"Taco Tuesday Social", tags:["Free Food"], desc:"All-you-can-eat tacos and mocktails...", location:"Dining Hall Patio", attending:76, capacity:100, starts:"6h 55m", seatsLeft:24, category:"Social", rsvpStatus:"available" },
];

export default function Dashboard() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [mySchedule, setMySchedule] = useState([]);
  const [events, setEvents] = useState(bottomEventsInitial);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Events');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Handle RSVP or Cancel RSVP
  const handleRSVPAction = (eventId) => {
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;

    const currentEvent = events[eventIndex];

    if (currentEvent.rsvpStatus === "rsvpd") {
      // Cancel RSVP
      setRsvpCount(prev => Math.max(0, prev - 1));
      setMySchedule(prev => prev.filter(id => id !== eventId));

      setEvents(prev => prev.map((ev, idx) => 
        idx === eventIndex ? { ...ev, rsvpStatus: "available" } : ev
      ));
    } else if (currentEvent.rsvpStatus === "available") {
      // RSVP
      setRsvpCount(prev => prev + 1);
      setMySchedule(prev => [...new Set([...prev, eventId])]);

      setEvents(prev => prev.map((ev, idx) => 
        idx === eventIndex ? { ...ev, rsvpStatus: "rsvpd" } : ev
      ));
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const featured = featuredEvents[currentSlide];

  const filteredEvents = useMemo(() => {
    const term = debouncedSearchTerm.toLowerCase().trim();
    return events.filter(event => {
      const matchesSearch = !term || 
        event.title.toLowerCase().includes(term) ||
        event.desc.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term) ||
        event.tags.some(tag => tag.toLowerCase().includes(term));

      const matchesCategory = activeCategory === 'All Events' || event.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [events, debouncedSearchTerm, activeCategory]);

  const categories = ["All Events", "Sports", "Arts", "Academic", "Social", "Free Food", "Tech"];

  return (
    <>
      <DashboardNavbar rsvpCount={rsvpCount} />

      <div className="bg-white text-slate-900 min-h-screen">
        {/* Featured Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
          <div 
            className="bg-[#1E3A8A] text-white rounded-3xl overflow-hidden relative shadow-lg"
            style={{ backgroundImage: `url('${featured.image}')`, backgroundSize: 'cover' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
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
                <div>👥 {featured.attending}/{featured.capacity} attending</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="font-mono text-4xl sm:text-5xl font-bold tabular-nums">{featured.countdown}</div>
                <Link to={`/event/${featured.id}`} className="bg-white text-[#1E3A8A] px-8 py-4 rounded-2xl font-semibold hover:bg-slate-100 transition-all">
                  View Details
                </Link>
              </div>
            </div>
          </div>
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
            {filteredEvents.length === 0 ? (
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
                      <div>👥 {event.attending}/{event.capacity}</div>
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
                        disabled={event.rsvpStatus === "rsvpd"}
                        className={`flex-1 py-3.5 rounded-2xl font-medium text-sm transition-all ${
                          event.rsvpStatus === "rsvpd" 
                            ? "bg-slate-100 text-slate-500 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {event.rsvpStatus === "rsvpd" ? "RSVP'd" : "Count Me In"}
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