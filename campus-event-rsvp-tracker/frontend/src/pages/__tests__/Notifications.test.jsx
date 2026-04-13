import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Notifications from '../Notifications';

const mocks = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGetMyRSVPs: vi.fn(),
  mockMarkAllAsRead: vi.fn(),
  mockMarkAsRead: vi.fn(),
  mockRemoveNotification: vi.fn()
}));

const notificationsState = {
  notifications: [],
  loading: false,
  error: '',
  unreadCount: 0,
  deletingNotificationId: '',
  fetchNotifications: vi.fn(),
  markAllAsRead: mocks.mockMarkAllAsRead,
  markAsRead: mocks.mockMarkAsRead,
  removeNotification: mocks.mockRemoveNotification
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.mockNavigate
  };
});

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => notificationsState)
}));

vi.mock('../../services/api', () => ({
  getApiError: vi.fn((error, fallbackMessage = 'Request failed') => ({
    code: error?.response?.data?.error?.code || 'REQUEST_FAILED',
    message: error?.response?.data?.error?.message || fallbackMessage
  })),
  getMyRSVPs: mocks.mockGetMyRSVPs
}));

vi.mock('../../components/common/DashboardNavbar', () => ({
  default: () => <div>Dashboard Navbar</div>
}));

vi.mock('../../components/common/Footer', () => ({
  default: () => <div>Footer</div>
}));

describe('Notifications page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    notificationsState.notifications = [
      {
        id: 'notif-1',
        title: 'Event Tomorrow',
        message: 'Spring event starts tomorrow.',
        type: 'info',
        read: false,
        created_at: new Date().toISOString(),
        eventId: 'event-1'
      }
    ];
    notificationsState.loading = false;
    notificationsState.error = '';
    notificationsState.unreadCount = 1;
    notificationsState.deletingNotificationId = '';

    mocks.mockGetMyRSVPs.mockResolvedValue({ data: { data: [] } });
    mocks.mockMarkAllAsRead.mockResolvedValue(true);
    mocks.mockMarkAsRead.mockResolvedValue(true);
    mocks.mockRemoveNotification.mockResolvedValue(true);
  });

  it('renders dedicated notifications layout and cards', async () => {
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    expect(screen.getByText('Event Tomorrow')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
  });

  it('marks all as read and navigates to event from notification action', async () => {
    render(
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /mark all as read/i }));
    expect(mocks.mockMarkAllAsRead).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /view event/i }));

    await waitFor(() => {
      expect(mocks.mockMarkAsRead).toHaveBeenCalledWith('notif-1');
      expect(mocks.mockNavigate).toHaveBeenCalledWith('/event/event-1');
    });
  });
});
