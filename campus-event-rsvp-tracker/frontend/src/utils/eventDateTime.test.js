import { describe, expect, it } from 'vitest';
import { getLiveEventTiming } from './eventDateTime';

const to24HourTime = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

describe('getLiveEventTiming', () => {
  it('returns ended when now passes start + duration', () => {
    const nowMs = Date.now();
    const start = new Date(nowMs - 40 * 60 * 1000);

    const result = getLiveEventTiming({
      eventDate: start.toISOString(),
      time: to24HourTime(start),
      durationMinutes: 30,
      status: 'Published',
      nowMs
    });

    expect(result.state).toBe('ended');
    expect(result.startsIn).toBe('Completed');
  });

  it('returns started when event has started but has not ended', () => {
    const nowMs = Date.now();
    const start = new Date(nowMs - 20 * 60 * 1000);

    const result = getLiveEventTiming({
      eventDate: start.toISOString(),
      time: to24HourTime(start),
      durationMinutes: 120,
      status: 'Published',
      nowMs
    });

    expect(result.state).toBe('started');
  });

  it('uses default duration when duration is missing', () => {
    const nowMs = Date.now();
    const start = new Date(nowMs - 70 * 60 * 1000);

    const result = getLiveEventTiming({
      eventDate: start.toISOString(),
      time: to24HourTime(start),
      status: 'Published',
      nowMs
    });

    expect(result.state).toBe('ended');
  });
});
