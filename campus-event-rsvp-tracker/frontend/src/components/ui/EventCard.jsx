import { Link } from 'react-router-dom';
export default function EventCard({ event }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
      <img 
        src={event.image} 
        alt={event.title} 
        className="w-full h-56 object-cover group-hover:scale-105 transition-transform" 
      />
      <div className="p-6">
        <span className="inline-block bg-teal-100 text-teal-700 text-xs px-4 py-1 rounded-full font-medium mb-3">
          {event.tag}
        </span>
        <h3 className="font-semibold text-xl mb-1">{event.title}</h3>
        <p className="text-slate-500 text-sm mb-6">📍 {event.location} • {event.date}</p>
        
        <div className="w-full text-center bg-blue-600 group-hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold transition-all">
          Join Event
        </div>
      </div>
    </div>
  );
}