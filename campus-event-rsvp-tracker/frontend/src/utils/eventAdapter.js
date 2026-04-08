const DEFAULT_CATEGORY = "General";

const pad2 = (value) => String(value).padStart(2, "0");

export const getCountdown = (eventDate) => {
  if (!eventDate) {
    return "-- : -- : --";
  }

  const target = new Date(eventDate).getTime();
  if (Number.isNaN(target)) {
    return "-- : -- : --";
  }

  const diff = target - Date.now();
  if (diff <= 0) {
    return "00 : 00 : 00";
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${pad2(hours)} : ${pad2(minutes)} : ${pad2(seconds)}`;
};

export const getStartsIn = (eventDate) => {
  if (!eventDate) {
    return "TBA";
  }

  const target = new Date(eventDate).getTime();
  if (Number.isNaN(target)) {
    return "TBA";
  }

  const diff = target - Date.now();
  if (diff <= 0) {
    return "Started";
  }

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }

  return `${hours}h ${minutes}m`;
};

const normalizeTags = (tags, category) => {
  if (Array.isArray(tags) && tags.length > 0) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (category) {
    return [String(category).trim()];
  }

  return [DEFAULT_CATEGORY];
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "Date TBA";
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return "Date TBA";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const normalizeId = (event) => {
  const rawId = event?._id ?? event?.id;
  return rawId ? String(rawId) : "";
};

export const mapApiEvent = (event = {}, { rsvpSet = new Set() } = {}) => {
  const id = normalizeId(event);
  const tags = normalizeTags(event.tags, event.category);
  const category = event.category || tags[0] || DEFAULT_CATEGORY;
  const attending = Number.isInteger(event.attending)
    ? event.attending
    : Number(event.attending_count || 0);
  const capacity = Number.isInteger(event.capacity)
    ? event.capacity
    : Number(event.capacity || 0);
  const seatsLeft = capacity > 0 ? Math.max(0, capacity - attending) : null;
  const date = formatDate(event.event_date);
  const time = event.time || "TBA";

  return {
    id,
    title: event.title || "Untitled event",
    desc: event.description || "No description available yet.",
    description: event.description || "No description available yet.",
    location: event.location || "Location to be announced",
    date,
    time,
    attending,
    capacity,
    starts: getStartsIn(event.event_date),
    countdown: getCountdown(event.event_date),
    seatsLeft,
    tags,
    tag: category,
    category,
    status: event.status || "Draft",
    image: event.image_url || `https://picsum.photos/seed/${id || "event"}/2000/1200`,
    organizer: event.organizer || "Campus Organization",
    rsvpStatus: rsvpSet.has(id) ? "rsvpd" : "available"
  };
};

export const mapMyRsvpRecord = (record = {}) => {
  const event = record.event || {};
  const eventId = normalizeId(event);
  const mapped = mapApiEvent(event, {
    rsvpSet: eventId ? new Set([eventId]) : new Set()
  });

  return {
    ...mapped,
    rsvpId: record.rsvp_id || null,
    rsvpDate: record.rsvp_date || null,
    rsvpStatus: "rsvpd"
  };
};