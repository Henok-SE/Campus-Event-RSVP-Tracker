// src/components/common/DashboardNavbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Bell, Sparkles, Plus } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export default function DashboardNavbar({ rsvpCount = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-600" aria-hidden="true" />
          <span className="hidden sm:inline text-xl sm:text-2xl font-semibold tracking-tight">CampusVibe</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 md:gap-7">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 sm:text-sm">
            {rsvpCount} RSVP'd
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => {
                navigate('/notifications');
              }}
              aria-label="Notifications"
              className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white hover:text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5"
            >
              <Bell className="h-5 w-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-5 h-5 px-1 flex items-center justify-center rounded-full shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <Link
            to="/create-event"
            aria-label="Create event"
            title="Create event"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </Link>

          <button
            onClick={() => navigate('/profile')}
            aria-label="Open profile"
            className="w-10 h-10 cursor-pointer bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {user?.name?.charAt(0) || 'H'}
          </button>
        </div>
      </div>
    </nav>
  );
}