// src/pages/EventDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import Footer from '../components/common/Footer';

export default function EventDetails() {
  const { id } = useParams();
  const { isLoggedIn } = useAuth();

  const [event, setEvent] = useState(null);
  const [rsvpStatus, setRsvpStatus] = useState('none'); // 'none' | 'confirmed'
  const [loading, setLoading] = useState(true);

  // Mock event data (replace with Axios later)
  useEffect(() => {
    setTimeout(() => {
      const mockEvent = {
        id: Number(id),
        title: "Intramural Basketball Finals",
        description: "Championship game between the Thunderbolts and the Pioneers. Bring your spirit! This is the highlight of the semester — come cheer for your favorite team, enjoy free snacks, and celebrate campus spirit. All students welcome.",
        location: "Recreation Center, Court A",
        date: "March 25, 2026 • 6:00 PM - 8:00 PM",
        attending: 256,
        capacity: 300,
        tags: ["Sports"],
        image: "https://picsum.photos/id/1018/1200/600",
        organizer: "Recreation Department",
      };
      setEvent(mockEvent);
      setLoading(false);
    }, 600);
  }, [id]);

  const handleRSVP = () => {
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=/event/${id}`;
      return;
    }
    setRsvpStatus('confirmed');
    alert("Successfully RSVP'd! Check your My Schedule.");
  };

  const handleCancel = () => {
    setRsvpStatus('none');
    alert("RSVP cancelled.");
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
        <h1 className="text-3xl font-bold mb-4">Event not found</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const isFull = event.attending >= event.capacity;
  const canRSVP = rsvpStatus === 'none' && !isFull;
  const isConfirmed = rsvpStatus === 'confirmed';

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
              className="h-64 sm:h-80 md:h-[420px] bg-cover bg-center"
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
              {isFull && (
                <span className="inline-flex px-4 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Full
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">{event.title}</h1>
            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-10">{event.description}</p>

            <div className="grid sm:grid-cols-3 gap-8 text-sm mb-12">
              <div>
                <p className="text-gray-500 mb-1 flex items-center gap-2">
                  <Clock size={16} /> When
                </p>
                <p className="font-medium">{event.date}</p>
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
                  onClick={handleRSVP}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-5 rounded-2xl font-semibold text-lg transition-all"
                >
                  Count Me In
                </button>
              ) : null}

              {isConfirmed && (
                <button
                  onClick={handleCancel}
                  className="px-10 py-5 rounded-2xl font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Cancel RSVP
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