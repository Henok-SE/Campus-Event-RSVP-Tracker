import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminControlCenter from '../AdminControlCenter';

const mockGetAdminEventStats = vi.fn();
const mockGetPendingReviewEvents = vi.fn();
const mockGetEvents = vi.fn();
const mockReviewEventSubmission = vi.fn();
const mockUpdateEvent = vi.fn();
const mockDeleteEvent = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      name: 'Admin User',
      role: 'Admin'
    }
  })
}));

vi.mock('../../services/api', () => ({
  getAdminEventStats: (...args) => mockGetAdminEventStats(...args),
  getPendingReviewEvents: (...args) => mockGetPendingReviewEvents(...args),
  getEvents: (...args) => mockGetEvents(...args),
  reviewEventSubmission: (...args) => mockReviewEventSubmission(...args),
  updateEvent: (...args) => mockUpdateEvent(...args),
  deleteEvent: (...args) => mockDeleteEvent(...args),
  getApiError: (error, fallbackMessage) => ({
    message: error?.message || fallbackMessage
  })
}));

describe('AdminControlCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetAdminEventStats.mockResolvedValue({
      data: {
        data: {
          total_events: 2,
          pending_events: 1,
          published_events: 1,
          ongoing_events: 0,
          completed_events: 0,
          rejected_events: 0,
          cancelled_events: 0,
          total_rsvps: 5
        }
      }
    });

    mockGetPendingReviewEvents.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'pending-1',
            title: 'Pending Approval Event',
            description: 'Awaiting admin review',
            status: 'Pending',
            created_by: {
              name: 'Student Owner',
              student_id: '4444/18'
            },
            submitted_at: '2030-05-01T10:00:00.000Z'
          }
        ]
      }
    });

    mockGetEvents.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'published-1',
            title: 'Published Event',
            status: 'Published',
            location: 'Main Hall',
            attending: 3,
            event_date: '2030-05-02T10:00:00.000Z'
          }
        ]
      }
    });

    mockReviewEventSubmission.mockResolvedValue({ data: { success: true } });
    mockUpdateEvent.mockResolvedValue({ data: { success: true } });
    mockDeleteEvent.mockResolvedValue({ data: { success: true } });
  });

  it('renders stats and executes moderation + publish actions', async () => {
    render(
      <MemoryRouter>
        <AdminControlCenter />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/admin control center/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(() => {
      expect(mockReviewEventSubmission).toHaveBeenCalledWith('pending-1', { decision: 'approve' });
    });

    fireEvent.click(screen.getByRole('button', { name: /unpublish/i }));

    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith('published-1', { status: 'Cancelled' });
    });
  });
});
