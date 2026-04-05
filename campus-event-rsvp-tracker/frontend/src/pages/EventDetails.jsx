// src/pages/EventDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Footer from '../components/common/Footer';

export default function EventDetails() {
  const { id } = useParams();
  const { isLoggedIn } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [rsvpStatus, setRsvpStatus] = useState('none'); // 'none' | 'confirmed'
  const [loading, setLoading] = useState(true);

  // Dynamic mock event generator
  useEffect(() => {
    setTimeout(() => {
      const eventMeta = {
        1: { title: "Spring Hackathon '26", location: "Engineering Hall", date: "Mar 22-23", tag: "Tech", image: "https://picsum.photos/id/1015/1200/600" },
        2: { title: "Sunset Music Fest", location: "Campus Green", date: "Apr 5", tag: "Music", image: "https://picsum.photos/id/201/1200/600" },
        3: { title: "Student Art Exhibition", location: "Gallery West", date: "Apr 12-18", tag: "Art", image: "https://picsum.photos/id/301/1200/600" },
        4: { title: "Pizza & Philosophy", location: "Library Lounge", date: "Coming Soon", tag: "Free Food", image: "https://picsum.photos/id/401/1200/600" },
        5: { title: "24-Hour Hackathon", location: "Engineering Hall 201", date: "March 20", tag: "Tech", image: "https://picsum.photos/id/450/1200/600" },
        6: { title: "Sunset Yoga on the Lawn", location: "West Lawn", date: "Coming Soon", tag: "Social", image: "https://picsum.photos/id/601/1200/600" },
        7: { title: "Open Mic Night", location: "Student Center Stage", date: "Coming Soon", tag: "Arts", image: "https://picsum.photos/id/701/1200/600" },
        8: { title: "AI & Ethics Panel Discussion", location: "Auditorium B", date: "Coming Soon", tag: "Academic", image: "https://picsum.photos/id/801/1200/600" },
        9: { title: "Taco Tuesday Social", location: "Dining Hall Patio", date: "Coming Soon", tag: "Free Food", image: "https://picsum.photos/id/901/1200/600" }
      };

      const meta = eventMeta[Number(id)] || {
        title: "Intramural Basketball Finals",
        location: "Recreation Center",
        date: "March 25, 2026",
        tag: "Sports",
        image: "https://picsum.photos/id/1018/1200/600"
      };

      const mockEvent = {
        id: Number(id),
        title: meta.title,
        description: `Join us for ${meta.title}! Bring your spirit. This is the highlight of the week — come engage with the community, enjoy the atmosphere, and celebrate campus spirit. All students welcome.`,
        location: meta.location,
        date: meta.date + " • 6:00 PM - 8:00 PM",
        attending: Math.floor(Math.random() * 200) + 50,
        capacity: 300,
        tags: [meta.tag],
        image: meta.image,
        organizer: "Campus Organizations",
      };
      setEvent(mockEvent);
      setLoading(false);
    }, 400);
  }, [id]);

  const handleRSVP = () => {
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=/event/${id}`;
      return;
    }
    setRsvpStatus('confirmed');
    toast.success("Successfully RSVP'd! Check your My Schedule.");
  };

  const handleCancel = () => {
    setRsvpStatus('none');
    toast.success("RSVP cancelled.");
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