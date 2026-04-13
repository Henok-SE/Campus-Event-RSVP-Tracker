import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../Profile';

const mocks = vi.hoisted(() => ({
  mockLogout: vi.fn(),
  mockGetMyRSVPs: vi.fn()
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      name: 'John Doe',
      email: 'john.doe@university.edu',
      student_id: '2001/18',
      role: 'Student',
      interest_categories: ['Tech', 'Academic'],
      interest_keywords: ['robotics']
    },
    logout: mocks.mockLogout
  })
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

describe('Profile page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockGetMyRSVPs.mockResolvedValue({
      data: {
        data: [
          { event: { status: 'Published', category: 'Tech' } },
          { event: { status: 'Completed', category: 'Academic' } },
          { event: { status: 'Published', category: 'Tech' } }
        ]
      }
    });
  });

  it('renders real RSVP-based metrics', async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mocks.mockGetMyRSVPs).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("Events RSVP'd")).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Upcoming events')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Completed events')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('signs out from profile action', async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mocks.mockGetMyRSVPs).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(mocks.mockLogout).toHaveBeenCalledTimes(1);
  });
});
