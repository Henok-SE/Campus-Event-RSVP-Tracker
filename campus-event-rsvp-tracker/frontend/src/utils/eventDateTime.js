const pad2 = (value) => String(value).padStart(2, '0');

const DATE_PREFIX_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const TIME_24H_RE = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const TIME_12H_RE = /^(\d{1,2}):([0-5]\d)\s*([AaPp][Mm])$/;
const TIME_12H_HOUR_ONLY_RE = /^(\d{1,2})\s*([AaPp][Mm])$/;

const getDateParts = (eventDate) => {
  if (!eventDate) {
    return null;
  }

  if (typeof eventDate === 'string') {
    const prefixed = eventDate.match(DATE_PREFIX_RE);
    if (prefixed) {
      return {
        year: Number(prefixed[1]),
        month: Number(prefixed[2]),
        day: Number(prefixed[3])
      };
    }
  }

  const parsed = new Date(eventDate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate()
  };
};

const getTimeParts = (timeValue) => {
  const value = String(timeValue || '').trim();
  if (!value || value.toUpperCase() === 'TBA') {
    return null;
  }

  const match24h = value.match(TIME_24H_RE);
  if (match24h) {
    return {
      hour: Number(match24h[1]),
      minute: Number(match24h[2]),
      second: Number(match24h[3] || 0)
    };
  }

  const match12h = value.match(TIME_12H_RE);
  if (match12h) {
    const hour12 = Number(match12h[1]);
    if (hour12 < 1 || hour12 > 12) {
      return null;
    }

    const minute = Number(match12h[2]);
    const meridian = match12h[3].toLowerCase();
    const hour = (hour12 % 12) + (meridian === 'pm' ? 12 : 0);

    return {
      hour,
      minute,
      second: 0
    };
  }

  const hourOnly12h = value.match(TIME_12H_HOUR_ONLY_RE);
  if (hourOnly12h) {
    const hour12 = Number(hourOnly12h[1]);
    if (hour12 < 1 || hour12 > 12) {
      return null;
    }

    const meridian = hourOnly12h[2].toLowerCase();
    const hour = (hour12 % 12) + (meridian === 'pm' ? 12 : 0);

    return {
      hour,
      minute: 0,
      second: 0
    };
  }

  return null;
};

const getPostStartLabel = (status) => {
  const normalized = String(status || '').trim().toLowerCase();

  if (normalized === 'completed') {
    return 'Completed';
  }

  if (normalized === 'ongoing') {
    return 'Ongoing';
  }

  return 'Started';
};

const formatCountdown = (diffMs) => {
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${pad2(hours)} : ${pad2(minutes)} : ${pad2(seconds)}`;
};

const formatStartsIn = (diffMs) => {
  const totalMinutes = Math.floor(diffMs / 60000);

  if (totalMinutes < 1) {
    return 'Under 1m';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

export const getEventStartTimestamp = (eventDate, eventTime) => {
  const dateParts = getDateParts(eventDate);
  const timeParts = getTimeParts(eventTime);

  if (!dateParts || !timeParts) {
    return null;
  }

  const start = new Date(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    timeParts.hour,
    timeParts.minute,
    timeParts.second,
    0
  );

  const startTime = start.getTime();
  if (Number.isNaN(startTime)) {
    return null;
  }

  return startTime;
};

export const getLiveEventTiming = ({ eventDate, time, status, nowMs = Date.now() }) => {
  const startTimestamp = getEventStartTimestamp(eventDate, time);

  if (!startTimestamp) {
    return {
      state: 'unknown',
      countdown: '-- : -- : --',
      startsIn: 'TBA'
    };
  }

  const diff = startTimestamp - nowMs;
  if (diff <= 0) {
    const label = getPostStartLabel(status);

    return {
      state: 'started',
      countdown: label,
      startsIn: label
    };
  }

  return {
    state: 'upcoming',
    countdown: formatCountdown(diff),
    startsIn: formatStartsIn(diff)
  };
};
