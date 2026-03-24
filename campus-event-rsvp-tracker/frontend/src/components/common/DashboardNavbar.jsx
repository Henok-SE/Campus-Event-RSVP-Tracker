// src/components/common/DashboardNavbar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Calendar, Settings, HelpCircle, Bell } from 'lucide-react';

export default function DashboardNavbar({ rsvpCount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Mock notifications (later connect to real backend)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "success",
      message: "You successfully RSVP'd to Intramural Basketball Finals",
      time: "2 min ago",
      read: false,
      eventId: 3
    },
    {
      id: 2,
      type: "reminder",
      message: "Sunset Yoga on the Lawn starts in 3 hours",
      time: "1 hour ago",
      read: true,
      eventId: 6
    },
    {
      id: 3,
      type: "info",
      message: "Taco Tuesday Social has 12 spots left",
      time: "Yesterday",
      read: true,
      eventId: 9
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (eventId) => {
    setNotificationsOpen(false);
    if (eventId) navigate(`/event/${eventId}`);
  };

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">cv</div>
          <span className="text-2xl font-semibold tracking-tight">CampusVibe</span>
        </div>

        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="font-medium text-slate-700 hover:text-slate-900">Events</Link>
          <div className="font-medium text-slate-700">{rsvpCount} RSVP'd</div>

          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 max-h-[420px] overflow-auto">
                <div className="px-6 py-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">No new notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.eventId)}
                      className={`px-6 py-4 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 ${!notif.read ? 'bg-blue-50' : ''}`}
                    >
                      <p className="text-sm text-slate-700">{notif.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              {user?.name?.charAt(0) || 'H'}
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-6 py-4 border-b">
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

                <Link to="/my-schedule" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-6 py-4 hover:bg-slate-100">
                  <Calendar className="w-5 h-5" /> My Schedule
                </Link>

                <button onClick={() => { setProfileOpen(false); setShowSettingsModal(true); }} className="flex items-center gap-3 w-full px-6 py-4 hover:bg-slate-100 text-left">
                  <Settings className="w-5 h-5" /> Profile Settings
                </button>

                <button onClick={() => { setProfileOpen(false); setShowHelpModal(true); }} className="flex items-center gap-3 w-full px-6 py-4 hover:bg-slate-100 text-left">
                  <HelpCircle className="w-5 h-5" /> Help & Support
                </button>

                <div className="border-t my-2"></div>

                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-6 py-4 text-red-600 hover:bg-red-50">
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
            <p className="text-slate-600 mb-8">Profile editing coming soon.</p>
            <button onClick={() => setShowSettingsModal(false)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium hover:bg-blue-700">
              Close
            </button>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Help & Support</h2>
            <div className="space-y-4 text-slate-600">
              <p>Email: support@campusvibe.edu.et</p>
              <p>Phone: +251 911 234 567</p>
            </div>
            <button onClick={() => setShowHelpModal(false)} className="mt-8 w-full bg-blue-600 text-white py-4 rounded-2xl font-medium hover:bg-blue-700">
              Close
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}