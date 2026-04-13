// src/components/common/DashboardNavbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Calendar, Settings, HelpCircle, Bell, ClipboardCheck, Sparkles, Plus, User } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export default function DashboardNavbar({ rsvpCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const navRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-600" aria-hidden="true" />
          <span className="hidden sm:inline text-xl sm:text-2xl font-semibold tracking-tight">CampusVibe</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 md:gap-7" ref={navRef}>
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 sm:text-sm">
            {rsvpCount} RSVP'd
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => {
                setProfileOpen(false);
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

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
              }}
              aria-label="Profile menu"
              className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {user?.name?.charAt(0) || 'H'}
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-lg border border-slate-200 py-2 z-50">
                <div className="px-5 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {user?.name?.charAt(0) || 'H'}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{user?.name || "Henok"}</p>
                      <p className="text-sm text-slate-500">ID: {user?.student_id || "HSU/1234/15"}</p>
                      <p className="text-xs uppercase tracking-widest text-teal-600 mt-1">ROLE • {user?.role || "Student"}</p>
                    </div>
                  </div>
                </div>

                <Link to="/my-schedule" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <Calendar className="w-5 h-5" /> My Schedule
                </Link>

                <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <User className="w-5 h-5" /> Profile
                </Link>

                <Link to="/notifications" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <Bell className="w-5 h-5" /> Notifications
                </Link>

                <Link to="/profile-settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <Settings className="w-5 h-5" /> Profile Settings
                </Link>

                {user?.role === 'Admin' ? (
                  <Link to="/admin/review" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <ClipboardCheck className="w-5 h-5" /> Admin Review
                  </Link>
                ) : null}

                <a
                  href="mailto:support@campusvibe.edu.et"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <HelpCircle className="w-5 h-5" /> Help & Support
                </a>

                <div className="border-t my-2"></div>

                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-5 py-3.5 text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}