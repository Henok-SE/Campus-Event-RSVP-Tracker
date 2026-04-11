const DEFAULT_EVENT_DURATION_MINUTES = 60;
const MAX_EVENT_DURATION_MINUTES = 24 * 60;

const DATE_PREFIX_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const TIME_24H_RE = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const TIME_12H_RE = /^(\d{1,2}):([0-5]\d)\s*([AaPp][Mm])$/;
const TIME_12H_HOUR_ONLY_RE = /^(\d{1,2})\s*([AaPp][Mm])$/;

const getDateParts = (eventDate) => {
  if (!eventDate) {
    return null;
  }

  if (typeof eventDate === "string") {
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
  const value = String(timeValue || "").trim();
  if (!value || value.toUpperCase() === "TBA") {
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
    const hour = (hour12 % 12) + (meridian === "pm" ? 12 : 0);

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
    const hour = (hour12 % 12) + (meridian === "pm" ? 12 : 0);

    return {
      hour,
      minute: 0,
      second: 0
    };
  }

  return null;
};

const normalizeDurationMinutes = (rawValue) => {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return DEFAULT_EVENT_DURATION_MINUTES;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_EVENT_DURATION_MINUTES) {
    return null;
  }

  return parsed;
};

const getEventStartTimestamp = ({ event_date, time }) => {
  const dateParts = getDateParts(event_date);
  const timeParts = getTimeParts(time);

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

  const timestamp = start.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const reconcileLifecycleStatus = ({ event, nowMs = Date.now() }) => {
  if (!event) {
    return { changed: false, status: null };
  }

  const currentStatus = String(event.status || "");
  if (!currentStatus || ["Draft", "Pending", "Rejected", "Cancelled", "Completed"].includes(currentStatus)) {
    return { changed: false, status: currentStatus };
  }

  const startTimestamp = getEventStartTimestamp(event);
  const durationMinutes = normalizeDurationMinutes(event.duration_minutes);

  if (!startTimestamp || !durationMinutes) {
    return { changed: false, status: currentStatus };
  }

  const endTimestamp = startTimestamp + durationMinutes * 60 * 1000;

  let nextStatus = currentStatus;
  if (nowMs >= endTimestamp) {
    nextStatus = "Completed";
  } else if (nowMs >= startTimestamp) {
    nextStatus = "Ongoing";
  } else {
    nextStatus = "Published";
  }

  if (nextStatus === currentStatus) {
    return { changed: false, status: currentStatus };
  }

  event.status = nextStatus;
  return { changed: true, status: nextStatus };
};

module.exports = {
  DEFAULT_EVENT_DURATION_MINUTES,
  MAX_EVENT_DURATION_MINUTES,
  normalizeDurationMinutes,
  getEventStartTimestamp,
  reconcileLifecycleStatus
};
