// src/pages/Events.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../components/ui/EventCard';

const allEvents = [
  { id:1, title:"Spring Hackathon '26", date:"Mar 22-23", location:"Engineering Hall", tag:"Tech", image:"https://picsum.photos/id/1015/600/340" },
  { id:2, title:"Sunset Music Fest", date:"Apr 5", location:"Campus Green", tag:"Music", image:"https://picsum.photos/id/201/600/340" },
  { id:3, title:"Student Art Exhibition", date:"Apr 12-18", location:"Gallery West", tag:"Art", image:"https://picsum.photos/id/301/600/340" },
  { id:4, title:"Intramural Basketball Finals", date:"Mar 25", location:"Recreation Center", tag:"Sports", image:"https://picsum.photos/id/401/600/340" },
  { id:5, title:"24-Hour Hackathon", date:"Mar 20", location:"Engineering Hall 201", tag:"Tech", image:"https://picsum.photos/id/1015/600/340" },
];

const categories = ["All Events", "Sports", "Arts", "Academic", "Social", "Free Food", "Tech"];

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Events");

  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All Events" || event.tag === activeCategory;
    return matchesSearch && matchesCategory;
  });

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

        <div className="grid md:grid-cols-3 gap-8">
          {filteredEvents.map(event => (
            <Link key={event.id} to={`/event/${event.id}`}>
              <EventCard event={event} />
            </Link>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <p className="text-center text-2xl text-slate-400 py-20">No events found 😕</p>
        )}
      </div>
    </div>
  );
}