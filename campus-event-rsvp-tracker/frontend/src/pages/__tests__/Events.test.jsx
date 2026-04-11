import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Events from '../Events';
import { getApiError, getEvents } from '../../services/api';

vi.mock('../../services/api', () => ({
  getEvents: vi.fn(),
  getApiError: vi.fn()
}));

vi.mock('../../components/ui/EventCard', () => ({
  default: ({ event }) => <div>{event.title}</div>
}));

describe('Events page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getApiError.mockImplementation((error, fallbackMessage) => ({
      message: error?.message || fallbackMessage
    }));
  });

  it('shows non-public events returned for the current user', async () => {
    getEvents.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'pending-1',
            title: 'Pending Robotics Meetup',
            description: 'Pending event visible to creator',
            location: 'Innovation Hub',
            category: 'Tech',
            tags: ['Tech'],
            status: 'Pending',
            image_url: '/uploads/events/pending.png',
            event_date: '2030-05-01T15:00:00.000Z',
            time: '15:00'
          },
          {
            _id: 'published-1',
            title: 'Published Art Expo',
            description: 'Public event',
            location: 'Main Hall',
            category: 'Arts',
            tags: ['Arts'],
            status: 'Published',
            event_date: '2030-05-03T10:00:00.000Z',
            time: '10:00'
          }
        ]
      }
    });

    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pending Robotics Meetup')).toBeInTheDocument();
      expect(screen.getByText('Published Art Expo')).toBeInTheDocument();
    });
  });

  it('renders a fetch error when loading fails', async () => {
    getEvents.mockRejectedValue(new Error('Failed to load events from API'));

    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load events from API')).toBeInTheDocument();
    });
  });
});
