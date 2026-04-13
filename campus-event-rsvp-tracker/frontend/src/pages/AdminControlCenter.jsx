import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import DashboardNavbar from '../components/common/DashboardNavbar';
import Footer from '../components/common/Footer';
import BackButton from '../components/ui/BackButton';
import { useAuth } from '../context/AuthContext';
import {
  deleteEvent,
  getAdminEventStats,
  getApiError,
  getEvents,
  getPendingReviewEvents,
  reviewEventSubmission,
  updateEvent
} from '../services/api';
import { mapApiEvent } from '../utils/eventAdapter';

const STATUS_TONE = {
  Pending: 'bg-amber-100 text-amber-800',
  Published: 'bg-emerald-100 text-emerald-800',
  Ongoing: 'bg-sky-100 text-sky-800',
  Completed: 'bg-slate-200 text-slate-700',
  Rejected: 'bg-rose-100 text-rose-800',
  Cancelled: 'bg-slate-200 text-slate-700',
  Draft: 'bg-slate-200 text-slate-700'
};

const formatSubmittedAt = (value) => {
  if (!value) {
    return 'Unknown';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }

  return parsed.toLocaleString();
};

function StatCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </article>
  );
}

export default function AdminControlCenter() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [processingEventId, setProcessingEventId] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [stats, setStats] = useState({
    total_events: 0,
    pending_events: 0,
    published_events: 0,
    ongoing_events: 0,
    completed_events: 0,
    rejected_events: 0,
    cancelled_events: 0,
    total_rsvps: 0
  });
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);

  const loadAdminData = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage('');

    try {
      const [statsRes, pendingRes, eventsRes] = await Promise.all([
        getAdminEventStats(),
        getPendingReviewEvents(),
        getEvents()
      ]);

      const statsData = statsRes?.data?.data || {};
      const pendingRows = Array.isArray(pendingRes?.data?.data) ? pendingRes.data.data : [];
      const eventRows = Array.isArray(eventsRes?.data?.data) ? eventsRes.data.data : [];

      setStats({
        total_events: Number(statsData.total_events || 0),
        pending_events: Number(statsData.pending_events || 0),
        published_events: Number(statsData.published_events || 0),
        ongoing_events: Number(statsData.ongoing_events || 0),
        completed_events: Number(statsData.completed_events || 0),
        rejected_events: Number(statsData.rejected_events || 0),
        cancelled_events: Number(statsData.cancelled_events || 0),
        total_rsvps: Number(statsData.total_rsvps || 0)
      });

      const mappedPending = pendingRows.map((item) => ({
        ...mapApiEvent(item),
        submittedAt: item?.submitted_at || item?.created_at || null,
        creatorName: item?.created_by?.name || 'Unknown creator',
        creatorStudentId: item?.created_by?.student_id || 'Unknown ID'
      }));

      const mappedAll = eventRows
        .map((item) => mapApiEvent(item))
        .sort((a, b) => {
          const aDate = new Date(a.eventDateRaw || 0).getTime();
          const bDate = new Date(b.eventDateRaw || 0).getTime();
          return bDate - aDate;
        });

      setPendingEvents(mappedPending);
      setAllEvents(mappedAll);
    } catch (error) {
      const apiError = getApiError(error, 'Failed to load admin data');
      setErrorMessage(apiError.message);
      setPendingEvents([]);
      setAllEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const liveEventsCount = useMemo(
    () => Number(stats.published_events || 0) + Number(stats.ongoing_events || 0),
    [stats.ongoing_events, stats.published_events]
  );

  const moderationDisabled = Boolean(processingEventId);

  const handleModeration = async (eventId, decision) => {
    if (!eventId || moderationDisabled) {
      return;
    }

    const reason = String(rejectionReasons[eventId] || '').trim();
    if (decision === 'reject' && !reason) {
      setErrorMessage('Rejection reason is required to reject a pending event.');
      return;
    }

    setProcessingEventId(eventId);
    setErrorMessage('');

    try {
      await reviewEventSubmission(eventId, decision === 'approve'
        ? { decision: 'approve' }
        : { decision: 'reject', reason });

      setRejectionReasons((prev) => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });

      await loadAdminData({ silent: true });
    } catch (error) {
      const apiError = getApiError(error, `Failed to ${decision} event`);
      setErrorMessage(apiError.message);
    } finally {
      setProcessingEventId('');
    }
  };

  const handlePublishToggle = async (eventId, status) => {
    if (!eventId || moderationDisabled) {
      return;
    }

    const shouldUnpublish = status === 'Published' || status === 'Ongoing';

    setProcessingEventId(eventId);
    setErrorMessage('');

    try {
      await updateEvent(eventId, { status: shouldUnpublish ? 'Cancelled' : 'Published' });
      await loadAdminData({ silent: true });
    } catch (error) {
      const apiError = getApiError(error, shouldUnpublish ? 'Failed to unpublish event' : 'Failed to publish event');
      setErrorMessage(apiError.message);
    } finally {
      setProcessingEventId('');
    }
  };

  const handleDelete = async (eventId) => {
    if (!eventId || moderationDisabled) {
      return;
    }

    setProcessingEventId(eventId);
    setErrorMessage('');

    try {
      await deleteEvent(eventId);
      await loadAdminData({ silent: true });
    } catch (error) {
      const apiError = getApiError(error, 'Failed to delete event');
      setErrorMessage(apiError.message);
    } finally {
      setProcessingEventId('');
    }
  };

  return (
    <>
      <DashboardNavbar rsvpCount={stats.total_rsvps || 0} />

      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
          <BackButton to="/dashboard" label="Back to Dashboard" className="mb-6" />

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Signed in as {user?.name || 'Admin'}</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">Admin Control Center</h1>
              <p className="mt-2 text-slate-600">Manage moderation, publication, and lifecycle controls from one place.</p>
            </div>
            <button
              type="button"
              onClick={() => loadAdminData({ silent: true })}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              Loading admin control center...
            </div>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Events" value={stats.total_events} />
                <StatCard label="Pending Review" value={stats.pending_events} />
                <StatCard label="Live (Published + Ongoing)" value={liveEventsCount} />
                <StatCard label="Total RSVPs" value={stats.total_rsvps} />
              </section>

              <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-2xl font-semibold text-slate-900">Moderation Queue</h2>
                  <p className="text-sm text-slate-500">{pendingEvents.length} pending event{pendingEvents.length === 1 ? '' : 's'}</p>
                </div>

                {pendingEvents.length === 0 ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No pending events to review.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingEvents.map((event) => {
                      const isProcessing = processingEventId === event.id;

                      return (
                        <article key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                              <p className="mt-1 text-sm text-slate-600">{event.desc}</p>
                              <p className="mt-3 text-xs text-slate-500">
                                Submitted by {event.creatorName} ({event.creatorStudentId}) on {formatSubmittedAt(event.submittedAt)}
                              </p>
                            </div>

                            <div className="w-full lg:w-96">
                              <textarea
                                rows={3}
                                value={rejectionReasons[event.id] || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setRejectionReasons((prev) => ({ ...prev, [event.id]: value }));
                                }}
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                placeholder="Required when rejecting"
                              />

                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleModeration(event.id, 'approve')}
                                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
                                >
                                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleModeration(event.id, 'reject')}
                                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:bg-rose-400"
                                >
                                  <XCircle className="h-4 w-4" aria-hidden="true" />
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-900">All Events Management</h2>
                <p className="mt-1 text-sm text-slate-500">Publish, unpublish, or delete any event record.</p>

                {allEvents.length === 0 ? (
                  <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No events found.
                  </p>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-3">Event</th>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3">Date</th>
                          <th className="px-3 py-3">Attending</th>
                          <th className="px-3 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allEvents.map((event) => {
                          const isProcessing = processingEventId === event.id;
                          const statusTone = STATUS_TONE[event.status] || 'bg-slate-200 text-slate-700';
                          const isPublished = event.status === 'Published' || event.status === 'Ongoing';

                          return (
                            <tr key={event.id} className="border-b border-slate-100 last:border-b-0">
                              <td className="px-3 py-3">
                                <p className="font-medium text-slate-900">{event.title}</p>
                                <p className="text-xs text-slate-500">{event.location}</p>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone}`}>
                                  {event.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-slate-600">{event.date}</td>
                              <td className="px-3 py-3 text-slate-600">{event.attending}</td>
                              <td className="px-3 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handlePublishToggle(event.id, event.status)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-70"
                                  >
                                    {isPublished ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                                    {isPublished ? 'Unpublish' : 'Publish'}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleDelete(event.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-70"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                    Delete
                                  </button>

                                  <Link
                                    to={`/event/${event.id}`}
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                    Open
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
