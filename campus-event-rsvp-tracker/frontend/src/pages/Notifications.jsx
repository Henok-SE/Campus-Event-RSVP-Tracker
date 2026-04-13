import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Info,
  Trash2,
  TriangleAlert
} from 'lucide-react';
import DashboardNavbar from '../components/common/DashboardNavbar';
import Footer from '../components/common/Footer';
import BackButton from '../components/ui/BackButton';
import { useNotifications } from '../hooks/useNotifications';
import { getMyRSVPs } from '../services/api';
import { formatNotificationTime } from '../utils/notificationAdapter';

const getNotificationTone = (type) => {
  const normalized = String(type || '').toLowerCase();

  if (normalized === 'success') {
    return {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      icon: <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />
    };
  }

  if (normalized === 'warning' || normalized === 'reminder') {
    return {
      container: 'bg-amber-50 border-amber-200 text-amber-700',
      icon: <TriangleAlert className="h-4.5 w-4.5" aria-hidden="true" />
    };
  }

  return {
    container: 'bg-blue-50 border-blue-200 text-blue-700',
    icon: <Info className="h-4.5 w-4.5" aria-hidden="true" />
  };
};

export default function Notifications() {
  const navigate = useNavigate();
  const [rsvpCount, setRsvpCount] = useState(0);
  const {
    notifications,
    loading,
    error,
    unreadCount,
    deletingNotificationId,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    removeNotification
  } = useNotifications();

  useEffect(() => {
    let isMounted = true;

    const loadRsvpCount = async () => {
      try {
        const response = await getMyRSVPs();
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];

        if (!isMounted) {
          return;
        }

        setRsvpCount(rows.length);
      } catch {
        if (isMounted) {
          setRsvpCount(0);
        }
      }
    };

    loadRsvpCount();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenEvent = async (notification) => {
    if (!notification?.eventId) {
      return;
    }

    await markAsRead(notification.id);
    navigate(`/event/${notification.eventId}`);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleRetry = () => {
    fetchNotifications();
  };

  return (
    <>
      <DashboardNavbar rsvpCount={rsvpCount} />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
          <BackButton to="/dashboard" label="Back to Dashboard" className="mb-6" />

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Notifications</h1>
              <p className="mt-2 text-slate-600">
                {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              <Check className="h-4.5 w-4.5" aria-hidden="true" />
              Mark all as read
            </button>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              <p>{error}</p>
              <button type="button" onClick={handleRetry} className="mt-3 cursor-pointer font-medium text-blue-700 hover:underline">
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
              <Bell className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
              <p className="mt-4 text-lg font-semibold text-slate-700">You are all caught up</p>
              <p className="mt-2 text-sm text-slate-500">New activity will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const tone = getNotificationTone(notification.type);

                return (
                  <article
                    key={notification.id}
                    className={`rounded-2xl border bg-white px-4 py-4 sm:px-5 sm:py-5 transition-shadow duration-200 hover:shadow-md ${!notification.read ? 'border-blue-200' : 'border-slate-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone.container}`}>
                        {tone.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h2 className="text-lg font-semibold text-slate-900">{notification.title}</h2>
                            <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                          </div>

                          {!notification.read ? (
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" aria-label="Unread notification" />
                          ) : null}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>{formatNotificationTime(notification.created_at)}</span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {!notification.read ? (
                            <button
                              type="button"
                              onClick={() => markAsRead(notification.id)}
                              className="cursor-pointer rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                            >
                              Mark read
                            </button>
                          ) : null}

                          {notification.eventId ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEvent(notification)}
                              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                            >
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                                View Event
                              </span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => removeNotification(notification.id)}
                            disabled={deletingNotificationId === notification.id}
                            className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              {deletingNotificationId === notification.id ? 'Deleting...' : 'Delete'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
