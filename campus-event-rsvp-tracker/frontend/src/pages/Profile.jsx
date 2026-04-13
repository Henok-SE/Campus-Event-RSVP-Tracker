import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChartNoAxesColumn,
  Clock3,
  LogOut,
  Mail,
  Settings,
  Sparkles,
  User
} from 'lucide-react';
import DashboardNavbar from '../components/common/DashboardNavbar';
import Footer from '../components/common/Footer';
import BackButton from '../components/ui/BackButton';
import { useAuth } from '../context/AuthContext';
import { getApiError, getMyRSVPs } from '../services/api';

const getInitials = (name = '') => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [rsvpRecords, setRsvpRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRsvps = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const response = await getMyRSVPs();
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];

        if (!isMounted) {
          return;
        }

        setRsvpRecords(rows);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const apiError = getApiError(error, 'Failed to load profile activity');
        setErrorMessage(apiError.message);
        setRsvpRecords([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRsvps();

    return () => {
      isMounted = false;
    };
  }, []);

  const events = useMemo(() => (
    rsvpRecords
      .map((record) => record?.event)
      .filter(Boolean)
  ), [rsvpRecords]);

  const totalRsvps = rsvpRecords.length;

  const upcomingEventsCount = useMemo(
    () => events.filter((event) => !['Completed', 'Cancelled'].includes(String(event?.status || ''))).length,
    [events]
  );

  const completedEventsCount = useMemo(
    () => events.filter((event) => String(event?.status || '') === 'Completed').length,
    [events]
  );

  const categoryStats = useMemo(() => {
    const counts = {};

    for (const event of events) {
      const category = String(event?.category || event?.tags?.[0] || '').trim();
      if (!category) {
        continue;
      }

      counts[category] = (counts[category] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [events]);

  const maxCategoryCount = categoryStats[0]?.count || 1;

  const interestCategories = Array.isArray(user?.interest_categories) ? user.interest_categories : [];
  const interestKeywords = Array.isArray(user?.interest_keywords) ? user.interest_keywords : [];

  const interestTags = [
    ...interestCategories.map((value) => ({ label: value, tone: 'bg-blue-50 text-blue-700 border-blue-200' })),
    ...interestKeywords.slice(0, 2).map((value) => ({ label: value, tone: 'bg-purple-50 text-purple-700 border-purple-200' }))
  ];

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <DashboardNavbar rsvpCount={totalRsvps} />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
          <BackButton to="/dashboard" label="Back to Dashboard" className="mb-6" />

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
                  {getInitials(user?.name)}
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{user?.name || 'User'}</h1>
                  <p className="mt-1 inline-flex items-center gap-2 text-slate-600">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    {user?.email || 'No email on file'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">ID: {user?.student_id || 'Not available'}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {user?.role || 'Student'}
                    </span>
                    {interestTags.map((tag) => (
                      <span
                        key={tag.label}
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tag.tone}`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                to="/profile-settings"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Edit Profile
              </Link>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <Calendar className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <p className="text-3xl font-bold text-slate-900">{totalRsvps}</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">Events RSVP'd</p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <Clock3 className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <p className="text-3xl font-bold text-slate-900">{upcomingEventsCount}</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">Upcoming events</p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <ChartNoAxesColumn className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <p className="text-3xl font-bold text-slate-900">{completedEventsCount}</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">Completed events</p>
            </article>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="text-xl font-semibold text-slate-900">Favorite Categories</h2>

              {loading ? (
                <p className="mt-4 text-sm text-slate-500">Loading category activity...</p>
              ) : categoryStats.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No RSVP category activity yet.</p>
              ) : (
                <div className="mt-5 space-y-3">
                  {categoryStats.map((item) => {
                    const width = Math.max(8, Math.round((item.count / maxCategoryCount) * 100));

                    return (
                      <div key={item.category}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{item.category}</span>
                          <span className="text-slate-500">{item.count} event{item.count > 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            <aside className="space-y-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>

                <div className="mt-4 space-y-2">
                  <Link to="/my-schedule" className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    My Schedule
                  </Link>
                  <Link to="/notifications" className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Notifications
                  </Link>
                  {isAdmin ? (
                    <Link to="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100">
                      <User className="h-4 w-4" aria-hidden="true" />
                      Admin Control Center
                    </Link>
                  ) : (
                    <Link to="/profile-settings" className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100">
                      <User className="h-4 w-4" aria-hidden="true" />
                      Preferences
                    </Link>
                  )}
                </div>
              </article>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full cursor-pointer rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign Out
                </span>
              </button>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
