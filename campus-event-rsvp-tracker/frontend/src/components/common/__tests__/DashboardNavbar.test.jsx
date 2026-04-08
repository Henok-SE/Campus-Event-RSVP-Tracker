import { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DashboardNavbar from '../DashboardNavbar';

const {
  mockLogout,
  mockDeleteNotification,
  mockGetNotifications,
  mockMarkAllNotificationsRead,
  mockMarkNotificationRead
} = vi.hoisted(() => ({
  mockLogout: vi.fn(),
  mockDeleteNotification: vi.fn(),
  mockGetNotifications: vi.fn(),
  mockMarkAllNotificationsRead: vi.fn(),
  mockMarkNotificationRead: vi.fn()
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      name: 'Test User',
      student_id: '1234/18',
      role: 'student'
    },
    logout: mockLogout
  })
}));

vi.mock('../../../services/api', () => ({
  getApiError: vi.fn((error, fallbackMessage = 'Request failed') => ({
    code: error?.response?.data?.error?.code || 'REQUEST_FAILED',
    message: error?.response?.data?.error?.message || fallbackMessage
  })),
  deleteNotification: mockDeleteNotification,
  getNotifications: mockGetNotifications,
  markAllNotificationsRead: mockMarkAllNotificationsRead,
  markNotificationRead: mockMarkNotificationRead
}));

function renderNavbar() {
  return render(
    <MemoryRouter>
      <DashboardNavbar rsvpCount={3} />
    </MemoryRouter>
  );
}

describe('DashboardNavbar notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('refreshes notifications on polling interval', async () => {
    vi.useFakeTimers();
    mockGetNotifications.mockResolvedValue({ data: { data: [] } });

    renderNavbar();

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockGetNotifications).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(45_000);
      await Promise.resolve();
    });

    expect(mockGetNotifications).toHaveBeenCalledTimes(2);
  });

  it('marks all notifications as read from the dropdown action', async () => {
    mockGetNotifications.mockResolvedValue({
      data: {
        data: [
          {
            id: 'notif-1',
            type: 'success',
            title: 'RSVP confirmed',
            message: 'You are in.',
            read: false,
            created_at: new Date().toISOString(),
            event_id: 'event-1'
          }
        ]
      }
    });
    mockMarkAllNotificationsRead.mockResolvedValue({ data: { success: true } });

    renderNavbar();

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    fireEvent.click(await screen.findByRole('button', { name: /mark all read/i }));

    await waitFor(() => {
      expect(mockMarkAllNotificationsRead).toHaveBeenCalledTimes(1);
    });
  });
});
