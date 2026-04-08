// src/components/common/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1E3A8A] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
        {/* Left - Logo + Description */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-white rounded-2xl flex items-center justify-center text-[#1E3A8A] font-bold text-2xl">cv</div>
            <span className="text-2xl font-semibold">CampusVibe</span>
          </div>
          <p className="text-slate-300 leading-relaxed max-w-xs">
            Your central hub for discovering and RSVPing to campus events. 
            Never miss what's happening on campus.
          </p>
        </div>

        {/* Middle - Quick Links */}
        <div>
          <h4 className="font-semibold text-lg mb-6">Quick Links</h4>
          <div className="space-y-3 text-sm">
            <Link to="/events" className="block hover:text-white transition-colors">Browse Events</Link>
            <Link to="/my-schedule" className="block hover:text-white transition-colors">My Schedule</Link>
            <Link to="/create-event" className="block hover:text-white transition-colors">Submit an Event</Link>
            <a href="mailto:support@campusvibe.edu.et" className="block hover:text-white transition-colors">Help & FAQ</a>
          </div>
        </div>

        {/* Right - Contact */}
        <div>
          <h4 className="font-semibold text-lg mb-6">Contact</h4>
          <div className="space-y-3 text-sm">
            <p>Peak Craft Informatics Community</p>
            <p>campusvibe@pcic.edu</p>
            <p>Student Center, Room 204</p>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-white/20 mt-16 pt-8 text-center text-sm text-slate-400">
        © 2026 CampusVibe — Peak Craft Informatics Community. All rights reserved.
      </div>
    </footer>
  );
}