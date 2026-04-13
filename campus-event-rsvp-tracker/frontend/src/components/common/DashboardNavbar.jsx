// src/components/common/DashboardNavbar.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Calendar, Settings, HelpCircle, Bell, Trash2, ClipboardCheck, Sparkles, Plus } from 'lucide-react';
import {
  getApiError,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../../services/api';

const formatNotificationTime = (value) => {
  if (!value) {
    return 'Just now';
  }

  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) {
    return 'Just now';
  }

  const diffMinutes = Math.floor((Date.now() - createdAt.getTime()) / 60000);

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return createdAt.toLocaleDateString();
};

const toNotificationVm = (item) => ({
  id: item?.id,
  type: item?.type || 'info',
  title: item?.title || 'Notification',
  message: item?.message || '',
  read: Boolean(item?.read),
  created_at: item?.created_at,
  eventId: item?.event_id || null
});

const NOTIFICATIONS_POLL_MS = 45_000;

export default function DashboardNavbar({ rsvpCount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [deletingNotificationId, setDeletingNotificationId] = useState('');
  const notificationsRequestInFlightRef = useRef(false);

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (notificationsRequestInFlightRef.current) {
      return;
    }

    notificationsRequestInFlightRef.current = true;

    if (!silent) {
      setNotificationsLoading(true);
      setNotificationsError('');
    }

    try {
      const response = await getNotifications();
      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      setNotifications(rows.map((item) => toNotificationVm(item)));
    } catch (error) {
      const apiError = getApiError(error, 'Failed to load notifications');
      setNotificationsError(apiError.message);

      if (!silent) {
        setNotifications([]);
      }
    } finally {
      notificationsRequestInFlightRef.current = false;

      if (!silent) {
        setNotificationsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      if (!document.hidden) {
        fetchNotifications({ silent: true });
      }
    }, NOTIFICATIONS_POLL_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    const snapshot = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await markAllNotificationsRead();
    } catch (error) {
      const apiError = getApiError(error, 'Failed to update notifications');
      setNotifications(snapshot);
      setNotificationsError(apiError.message);
    }
  };

  const handleNotificationClick = async (notification) => {
    setNotificationsOpen(false);

    if (!notification.read) {
      const snapshot = notifications;
      setNotifications((prev) => prev.map((n) => (
        n.id === notification.id ? { ...n, read: true } : n
      )));

      try {
        await markNotificationRead(notification.id);
      } catch {
        setNotifications(snapshot);
      }
    }

    if (notification.eventId) {
      navigate(`/event/${notification.eventId}`);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!notificationId || deletingNotificationId) {
      return;
    }

    const snapshot = notifications;
    setDeletingNotificationId(notificationId);
    setNotificationsError('');
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));

    try {
      await deleteNotification(notificationId);
    } catch (error) {
      const apiError = getApiError(error, 'Failed to delete notification');
      setNotifications(snapshot);
      setNotificationsError(apiError.message);
    } finally {
      setDeletingNotificationId('');
    }
  };

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
                const nextOpen = !notificationsOpen;
                setNotificationsOpen(nextOpen);
                if (nextOpen) {
                  setProfileOpen(false);
                  fetchNotifications();
                }
              }}
              aria-label="Notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-5 h-5 px-1 flex items-center justify-center rounded-full shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-lg border border-slate-200 py-2 z-50 max-h-105 overflow-auto">
                <div className="px-5 py-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs font-medium text-blue-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>

                {notificationsLoading ? (
                  <p className="text-center py-8 text-sm text-slate-500">Loading notifications...</p>
                ) : notificationsError ? (
                  <div className="px-5 py-5">
                    <p className="text-sm text-red-600">{notificationsError}</p>
                    <button onClick={fetchNotifications} className="mt-2 text-xs text-blue-600 hover:underline">
                      Retry
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="text-center py-8 text-sm text-slate-500">No new notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer border-b last:border-b-0 ${!notif.read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.08em] font-medium text-slate-500">{notif.title}</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{notif.message}</p>
                          <p className="text-xs text-slate-500 mt-1.5">{formatNotificationTime(notif.created_at)}</p>
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteNotification(notif.id);
                          }}
                          disabled={deletingNotificationId === notif.id}
                          className="shrink-0 rounded-full p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <Link
            to="/create-event"
            aria-label="Create event"
            title="Create event"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                if (!profileOpen) setNotificationsOpen(false);
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