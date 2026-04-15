import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import DashboardNavbar from '../DashboardNavbar';

const mocks = vi.hoisted(() => ({
  mockLogout: vi.fn(),
  mockUnreadCount: 0
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      name: 'Test User',
      student_id: '1234/18',
      role: 'student'
    },
    logout: mocks.mockLogout
  })
}));

vi.mock('../../../services/api', () => ({
  getApiError: vi.fn((error, fallbackMessage = 'Request failed') => ({
    code: error?.response?.data?.error?.code || 'REQUEST_FAILED',
    message: error?.response?.data?.error?.message || fallbackMessage
  }))
}));

vi.mock('../../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    unreadCount: mocks.mockUnreadCount
  }))
}));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location-path">{location.pathname}</span>;
}

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="*" element={<><DashboardNavbar rsvpCount={3} /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DashboardNavbar notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUnreadCount = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('navigates to dedicated notifications page on bell click', async () => {
    renderNavbar();

    fireEvent.click(screen.getByRole('button', { name: /open notifications/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location-path')).toHaveTextContent('/notifications');
    });
  });

  it('opens mobile quick actions and navigates to notifications', async () => {
    renderNavbar();

    const quickActionsButton = screen.getByRole('button', { name: /open quick actions menu/i });
    expect(quickActionsButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(quickActionsButton);

    expect(quickActionsButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Create event')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Notifications'));

    await waitFor(() => {
      expect(screen.getByTestId('location-path')).toHaveTextContent('/notifications');
      expect(quickActionsButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('closes mobile quick actions menu on Escape key', async () => {
    renderNavbar();

    const quickActionsButton = screen.getByRole('button', { name: /open quick actions menu/i });

    fireEvent.click(quickActionsButton);
    expect(screen.getByText('Create event')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Create event')).not.toBeInTheDocument();
      expect(quickActionsButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('shows unread badge count from notifications hook', async () => {
    mocks.mockUnreadCount = 4;

    renderNavbar();

    expect(screen.getByRole('button', { name: /open notifications/i })).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: /open quick actions menu/i })).toHaveTextContent('4');
  });
});
