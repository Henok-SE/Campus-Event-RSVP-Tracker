import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../Landing';

const {
  mockUseAuth,
  mockNavigate,
  mockGetEvents,
  mockGetApiError,
  mockMapApiEvent,
  observeSpy,
  unobserveSpy,
  disconnectSpy,
  observedElements
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockNavigate: vi.fn(),
  mockGetEvents: vi.fn(),
  mockGetApiError: vi.fn(),
  mockMapApiEvent: vi.fn(),
  observeSpy: vi.fn(),
  unobserveSpy: vi.fn(),
  disconnectSpy: vi.fn(),
  observedElements: []
}));

let observerCallback;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('../../services/api', () => ({
  getEvents: mockGetEvents,
  getApiError: mockGetApiError
}));

vi.mock('../../utils/eventAdapter', () => ({
  mapApiEvent: mockMapApiEvent
}));

vi.mock('../../components/ui/EventCard', () => ({
  default: ({ event }) => <div>{event.title}</div>
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Landing page scroll reveal', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    observedElements.length = 0;
    observerCallback = undefined;

    globalThis.IntersectionObserver = vi.fn((callback) => {
      observerCallback = callback;
      return {
        observe: (element) => {
          observeSpy(element);
          observedElements.push(element);
        },
        unobserve: unobserveSpy,
        disconnect: disconnectSpy
      };
    });

    mockUseAuth.mockReturnValue({ isLoggedIn: false });
    mockGetApiError.mockImplementation((error, fallbackMessage) => ({
      message: error?.message || fallbackMessage
    }));
    mockMapApiEvent.mockImplementation((event) => ({
      id: event._id,
      title: event.title,
      image: event.image_url,
      location: event.location,
      date: event.event_date,
      tag: event.category
    }));
    mockGetEvents.mockResolvedValue({
      data: {
        data: [
          {
            _id: 'event-1',
            title: 'Campus Innovation Summit',
            image_url: '/uploads/events/event-1.jpg',
            location: 'Innovation Hub',
            event_date: '2030-05-10T13:00:00.000Z',
            category: 'Tech',
            status: 'Published'
          }
        ]
      }
    });
  });

  it('observes reveal targets and marks them visible after intersection', async () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetEvents).toHaveBeenCalledTimes(1);
    });

    expect(observeSpy).toHaveBeenCalled();

    const heroHeading = screen.getByRole('heading', {
      name: /discover campus events easily/i
    });
    expect(heroHeading).toHaveAttribute('data-scroll-reveal');
    expect(heroHeading).not.toHaveClass('is-visible');

    observerCallback(
      observedElements.map((target) => ({
        isIntersecting: true,
        target
      })),
      {
        unobserve: unobserveSpy
      }
    );

    expect(heroHeading).toHaveClass('is-visible');
    expect(unobserveSpy).toHaveBeenCalled();
  });

  it('reveals immediately when IntersectionObserver is unavailable', async () => {
    delete globalThis.IntersectionObserver;

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    const finalCtaHeading = await screen.findByRole('heading', {
      name: /ready to vibe with your campus/i
    });
    const finalCtaWrapper = finalCtaHeading.closest('[data-scroll-reveal]');

    await waitFor(() => {
      expect(finalCtaWrapper).toHaveClass('is-visible');
    });
  });

  it('keeps logged-in redirect behavior unchanged', async () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: true });

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
