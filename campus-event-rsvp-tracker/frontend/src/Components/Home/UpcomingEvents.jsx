import React from 'react';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const events = [
  {
    title: "Spring Hackathon '26",
    date: "Mar 22 – 23",
    location: "Engineering Hall",
    category: "Tech"
  },
  {
    title: "Sunset Music Fest",
    date: "Apr 3",
    location: "Campus Green",
    category: "Music"
  },
  {
    title: "Student Art Exhibition",
    date: "Apr 12 – 18",
    location: "Gallery West",
    category: "Art"
  }
];

const UpcomingEvents = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
              DON'T MISS OUT
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900">
              Upcoming Events
            </h2>
          </div>
          <Link to="/events" className="text-blue-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
            View all events
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-lg transition">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                  <span>{event.location}</span>
                </div>
              </div>
              <button className="text-blue-600 font-semibold hover:text-blue-700 transition">
                Join Event →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;