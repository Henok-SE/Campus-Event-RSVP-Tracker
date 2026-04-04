// src/pages/MySchedule.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/common/Footer';
import { Calendar, MapPin, Users, X } from 'lucide-react';

export default function MySchedule() {
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data (replace with Axios GET /api/my-rsvps later)
  useEffect(() => {
    setTimeout(() => {
      const mockMyEvents = [
        {
          id: 6,
          title: "Sunset Yoga on the Lawn",
          date: "March 21, 2026",
          time: "6:00 PM",
          location: "West Lawn",
          attending: 45,
          capacity: 60,
          status: "confirmed",
          image: "https://picsum.photos/id/601/600/340"
        },
        {
          id: 3,
          title: "Intramural Basketball Finals",
          date: "March 25, 2026",
          time: "6:00 PM",
          location: "Recreation Center",
          attending: 256,
          capacity: 300,
          status: "confirmed",
          image: "https://picsum.photos/id/1018/600/340"
        },
        {
          id: 9,
          title: "Taco Tuesday Social",
          date: "March 24, 2026",
          time: "7:00 PM",
          location: "Dining Hall Patio",
          attending: 76,
          capacity: 100,
          status: "confirmed",
          image: "https://picsum.photos/id/901/600/340"
        }
      ];
      setMyEvents(mockMyEvents);
      setLoading(false);
    }, 600);
  }, []);

  const handleCancelRSVP = (eventId) => {
    setMyEvents(prev => prev.filter(ev => ev.id !== eventId));
    alert(`RSVP cancelled for this event.`);
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
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between mt-4">
            <h1 className="text-3xl font-bold">My Schedule</h1>
            <div className="text-sm text-slate-500">
              {myEvents.length} upcoming event{myEvents.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {myEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
            <Calendar className="w-16 h-16 mx-auto text-slate-400 mb-6" />
            <h2 className="text-2xl font-semibold mb-4 text-slate-800">No upcoming events</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              You haven't RSVP'd to any events yet.<br />
              Browse events and join something exciting!
            </p>
            <Link
              to="/dashboard"
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
                    className="sm:w-48 h-40 sm:h-40 rounded-2xl bg-cover bg-center flex-shrink-0" 
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
                    <span className="inline-flex px-5 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Confirmed
                    </span>
                    
                    <button
                      onClick={() => handleCancelRSVP(ev.id)}
                      className="mt-6 sm:mt-0 px-8 py-3 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                    >
                      <X size={18} /> Cancel RSVP
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