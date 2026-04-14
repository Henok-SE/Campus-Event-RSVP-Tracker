import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapApiEvent } from './eventAdapter';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('mapApiEvent image normalization', () => {
  it('uses localhost API fallback for relative upload paths when API base is unset', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');

    const mapped = mapApiEvent({
      _id: 'evt-0',
      title: 'Fallback Event',
      status: 'Published',
      image_url: '/uploads/events/fallback.png',
      event_date: '2030-01-09T09:00:00.000Z',
      time: '09:00'
    });

    expect(mapped.image).toBe('http://localhost:5050/uploads/events/fallback.png');
  });

  it('prefixes relative upload paths with API origin', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.campus-events.example/api');

    const mapped = mapApiEvent({
      _id: 'evt-1',
      title: 'Cloud Security Workshop',
      status: 'Published',
      image_url: '/uploads/events/workshop.png',
      event_date: '2030-01-10T14:00:00.000Z',
      time: '14:00'
    });

    expect(mapped.image).toBe('https://api.campus-events.example/uploads/events/workshop.png');
  });

  it('keeps absolute image URLs unchanged', () => {
    const mapped = mapApiEvent({
      _id: 'evt-2',
      title: 'Career Fair',
      status: 'Published',
      image_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      event_date: '2030-01-11T09:00:00.000Z',
      time: '09:00'
    });

    expect(mapped.image).toBe('https://res.cloudinary.com/demo/image/upload/sample.jpg');
  });

  it('rewrites legacy localhost upload URLs to the configured API origin', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.campus-events.example/api');

    const mapped = mapApiEvent({
      _id: 'evt-3',
      title: 'Legacy Event',
      status: 'Published',
      image_url: 'http://localhost:5050/uploads/events/legacy-poster.jpg',
      event_date: '2030-01-12T09:00:00.000Z',
      time: '09:00'
    });

    expect(mapped.image).toBe('https://api.campus-events.example/uploads/events/legacy-poster.jpg');
  });

  it('normalizes upload paths without leading slash', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.campus-events.example/api');

    const mapped = mapApiEvent({
      _id: 'evt-4',
      title: 'Legacy Relative Event',
      status: 'Published',
      image_url: 'uploads/events/legacy-relative.jpg',
      event_date: '2030-01-13T09:00:00.000Z',
      time: '09:00'
    });

    expect(mapped.image).toBe('https://api.campus-events.example/uploads/events/legacy-relative.jpg');
  });
});
