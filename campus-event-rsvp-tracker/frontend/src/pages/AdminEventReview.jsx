import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardNavbar from '../components/common/DashboardNavbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/ui/BackButton';
import { getApiError, getPendingReviewEvents, reviewEventSubmission } from '../services/api';
import { mapApiEvent } from '../utils/eventAdapter';

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

export default function AdminEventReview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [processingEventId, setProcessingEventId] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadPendingEvents = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const response = await getPendingReviewEvents();
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        const mapped = rows.map((item) => ({
          ...mapApiEvent(item),
          submittedAt: item?.submitted_at || item?.created_at || null,
          creatorName: item?.created_by?.name || 'Unknown creator',
          creatorStudentId: item?.created_by?.student_id || 'Unknown ID'
        }));

        if (!isMounted) {
          return;
        }

        setEvents(mapped);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const apiError = getApiError(error, 'Failed to load pending events');
        setErrorMessage(apiError.message);
        setEvents([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPendingEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const queueCount = useMemo(() => events.length, [events]);

  const handleApprove = async (eventId) => {
    if (!eventId || processingEventId) {
      return;
    }

    setProcessingEventId(eventId);
    setErrorMessage('');

    try {
      await reviewEventSubmission(eventId, { decision: 'approve' });
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      const apiError = getApiError(error, 'Failed to approve event');
      setErrorMessage(apiError.message);
    } finally {
      setProcessingEventId('');
    }
  };

  const handleReject = async (eventId) => {
    if (!eventId || processingEventId) {
      return;
    }

    const reason = String(rejectionReasons[eventId] || '').trim();
    if (!reason) {
      setErrorMessage('Rejection reason is required.');
      return;
    }

    setProcessingEventId(eventId);
    setErrorMessage('');

    try {
      await reviewEventSubmission(eventId, { decision: 'reject', reason });
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      setRejectionReasons((prev) => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
    } catch (error) {
      const apiError = getApiError(error, 'Failed to reject event');
      setErrorMessage(apiError.message);
    } finally {
      setProcessingEventId('');
    }
  };

  return (
    <>
      <DashboardNavbar rsvpCount={0} />

      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <BackButton to="/dashboard" label="Back to Dashboard" className="mb-5" />

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
            <div>
              <p className="text-sm text-slate-500">Signed in as {user?.name || 'Admin'}</p>
              <h1 className="text-3xl sm:text-4xl font-bold">Admin Event Review</h1>
              <p className="text-slate-600 mt-2">Review student submissions before they become visible to everyone.</p>
            </div>
            <div className="text-sm rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-blue-700">
              Pending submissions: {queueCount}
            </div>
          </div>

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-500">
              Loading pending submissions...
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-500">
              No pending submissions right now.
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((event) => {
                const isProcessing = processingEventId === event.id;

                return (
                  <article key={event.id} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 transition-shadow duration-200 hover:shadow-md">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(event.tags || []).map((tag) => (
                            <span key={`${event.id}-${tag}`} className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                              {tag}
                            </span>
                          ))}
                          <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800">Pending Review</span>
                        </div>

                        <h2 className="text-2xl font-semibold mb-2">{event.title}</h2>
                        <p className="text-slate-600 mb-4">{event.description}</p>

                        <div className="text-sm text-slate-500 space-y-1">
                          <p>Submitted by: <span className="font-medium text-slate-700">{event.creatorName}</span> ({event.creatorStudentId})</p>
                          <p>Submitted at: <span className="font-medium text-slate-700">{formatSubmittedAt(event.submittedAt)}</span></p>
                          <p>Location: <span className="font-medium text-slate-700">{event.location}</span></p>
                          <p>Date: <span className="font-medium text-slate-700">{event.date}</span></p>
                        </div>
                      </div>

                      <div className="w-full lg:w-96 rounded-2xl border border-slate-200 p-4 bg-slate-50">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Rejection reason (required to reject)</label>
                        <textarea
                          rows={4}
                          value={rejectionReasons[event.id] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setRejectionReasons((prev) => ({ ...prev, [event.id]: value }));
                          }}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                          placeholder="Explain what should be fixed before resubmission"
                        />

                        <div className="mt-4 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => handleApprove(event.id)}
                            disabled={isProcessing}
                            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 disabled:bg-emerald-400 text-white px-4 py-2.5 font-medium transition-all duration-200"
                          >
                            {isProcessing ? 'Processing...' : 'Approve & Publish'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReject(event.id)}
                            disabled={isProcessing}
                            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 hover:-translate-y-0.5 disabled:bg-red-400 text-white px-4 py-2.5 font-medium transition-all duration-200"
                          >
                            {isProcessing ? 'Processing...' : 'Reject'}
                          </button>
                        </div>

                        <Link
                          to={`/event/${event.id}`}
                          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
                        >
                          Open full event details
                        </Link>
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
