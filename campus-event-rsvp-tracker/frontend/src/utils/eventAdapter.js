import { getLiveEventTiming } from './eventDateTime';

const DEFAULT_CATEGORY = "General";
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:/i;
const LOCALHOST_HOST_PATTERN = /^(localhost|127\.0\.0\.1)$/i;

const getApiOrigin = () => {
  const configuredApiBase = import.meta.env.VITE_API_BASE_URL;
  if (!configuredApiBase) {
    return "";
  }

  try {
    return new URL(configuredApiBase).origin;
  } catch {
    return "";
  }
};

const resolveEventImage = (rawImageValue) => {
  const imageValue = String(rawImageValue || "").trim();
  if (!imageValue) {
    return "";
  }

  if (ABSOLUTE_URL_PATTERN.test(imageValue)) {
    try {
      const parsedUrl = new URL(imageValue);
      const apiOrigin = getApiOrigin();
      const uploadsPath = parsedUrl.pathname || "";

      if (
        apiOrigin
        && LOCALHOST_HOST_PATTERN.test(parsedUrl.hostname)
        && uploadsPath.startsWith("/uploads/")
      ) {
        return `${apiOrigin}${uploadsPath}${parsedUrl.search || ""}`;
      }
    } catch {
      return imageValue;
    }

    return imageValue;
  }

  if (imageValue.startsWith("//")) {
    return imageValue;
  }

  if (imageValue.startsWith("/")) {
    const apiOrigin = getApiOrigin();
    return apiOrigin ? `${apiOrigin}${imageValue}` : imageValue;
  }

  if (imageValue.startsWith("uploads/")) {
    const normalizedUploadPath = `/${imageValue}`;
    const apiOrigin = getApiOrigin();
    return apiOrigin ? `${apiOrigin}${normalizedUploadPath}` : normalizedUploadPath;
  }

  return imageValue;
};

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
  const createdBy = event?.created_by?._id ?? event?.created_by ?? null;
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
  const parsedDurationMinutes = Number(event.duration_minutes ?? event.durationMinutes ?? event.duration);
  const durationMinutes = Number.isInteger(parsedDurationMinutes) && parsedDurationMinutes > 0
    ? parsedDurationMinutes
    : 60;
  const eventDateRaw = event.event_date || null;
  const resolvedImage = resolveEventImage(event.image_url || event.image);
  const timing = getLiveEventTiming({
    eventDate: eventDateRaw,
    time,
    status: event.status,
    durationMinutes
  });

  return {
    id,
    title: event.title || "Untitled event",
    desc: event.description || "No description available yet.",
    description: event.description || "No description available yet.",
    location: event.location || "Location to be announced",
    date,
    eventDateRaw,
    time,
    durationMinutes,
    attending,
    capacity,
    starts: timing.startsIn,
    countdown: timing.countdown,
    seatsLeft,
    tags,
    tag: category,
    category,
    status: event.status || "Draft",
    submittedAt: event.submitted_at || null,
    reviewedAt: event.reviewed_at || null,
    rejectionReason: event.rejection_reason || null,
    image: resolvedImage || `https://picsum.photos/seed/${id || "event"}/2000/1200`,
    organizer: event.organizer || "Campus Organization",
    createdBy: createdBy ? String(createdBy) : null,
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