const Event = require("../models/event");
const RSVP = require("../models/rsvp");
const Notification = require("../models/notification");
const User = require("../models/users");
const mongoose = require("mongoose");
const path = require("path");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { FIXED_INTEREST_CATEGORY_LOOKUP } = require("../config/interestOptions");
const { getConfig } = require("../config/env");
const { uploadBufferToCloudinary } = require("../utils/cloudinary");
const {
  DEFAULT_EVENT_DURATION_MINUTES,
  normalizeDurationMinutes,
  reconcileLifecycleStatus
} = require("../utils/eventLifecycle");

const PUBLIC_EVENT_STATUSES = ["Published", "Ongoing"];
const REVIEWABLE_EVENT_STATUS = "Pending";

const isAdmin = (user = {}) => user.role === "Admin";

const createNotificationSafely = async ({ user_id, type, title, message, event_id = null }) => {
  try {
    await Notification.create({
      user_id,
      type,
      title,
      message,
      event_id
    });
  } catch (error) {
    // Notifications are best-effort and should not block core event workflows.
  }
};

const normalizeToken = (value = "") => String(value).trim().replace(/\s+/g, " ").toLowerCase();

const collectEventInterestTokens = (event = {}) => {
  const rawTokens = [event.category, ...(Array.isArray(event.tags) ? event.tags : [])]
    .map((entry) => normalizeToken(entry))
    .filter(Boolean);

  const uniqueTokens = [...new Set(rawTokens)];
  const matchedCategories = [];

  for (const token of uniqueTokens) {
    const canonical = FIXED_INTEREST_CATEGORY_LOOKUP.get(token);
    if (canonical) {
      matchedCategories.push(canonical);
    }
  }

  return {
    eventTerms: uniqueTokens,
    matchedCategories: [...new Set(matchedCategories)]
  };
};

const notifyInterestedUsersOnPublish = async ({ event, excludeUserId }) => {
  try {
    const { eventTerms, matchedCategories } = collectEventInterestTokens(event);

    const interestClauses = [];
    if (matchedCategories.length > 0) {
      interestClauses.push({ interest_categories: { $in: matchedCategories } });
    }
    if (eventTerms.length > 0) {
      interestClauses.push({ interest_keywords: { $in: eventTerms } });
    }

    if (interestClauses.length === 0) {
      return;
    }

    const recipientFilter = {
      $or: interestClauses
    };

    if (excludeUserId) {
      recipientFilter._id = { $ne: excludeUserId };
    }

    const recipients = await User.find(recipientFilter).select("_id name");
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return;
    }

    await Promise.all(
      recipients.map((recipient) => createNotificationSafely({
        user_id: recipient._id,
        type: "info",
        title: "New event for your interests",
        message: `Hi ${recipient.name || "there"}, ${event.title || "a new event"} matches your interests and is now live.`,
        event_id: event._id
      }))
    );
  } catch (error) {
    // Interest notifications are best-effort and should not block publication.
  }
};

const normalizeTags = (tags, category) => {
  const parsedTags = Array.isArray(tags)
    ? tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];

  if (parsedTags.length > 0) {
    return [...new Set(parsedTags)];
  }

  if (category && String(category).trim()) {
    return [String(category).trim()];
  }

  return [];
};

const serializeEvent = (eventDoc, attendingCount) => {
  const event = eventDoc.toObject ? eventDoc.toObject() : eventDoc;
  const tags = Array.isArray(event.tags) && event.tags.length > 0
    ? event.tags
    : event.category
      ? [event.category]
      : [];
  const durationMinutes = normalizeDurationMinutes(event.duration_minutes) || DEFAULT_EVENT_DURATION_MINUTES;

  return {
    ...event,
    category: event.category || tags[0] || null,
    tags,
    duration_minutes: durationMinutes,
    attending: attendingCount
  };
};

const applyEventFields = (event, payload = {}) => {
  const {
    title,
    description,
    location,
    event_date,
    time,
    duration_minutes,
    capacity,
    category,
    image_url
  } = payload;

  const normalizedTags = normalizeTags(payload.tags, category ?? event.category);

  if (title !== undefined) {
    if (!title || !String(title).trim()) {
      return "title cannot be empty";
    }
    event.title = title;
  }

  if (description !== undefined) {
    event.description = description;
  }

  if (location !== undefined) {
    event.location = location;
  }

  if (event_date !== undefined) {
    if (!event_date) {
      event.event_date = null;
    } else {
      const parsedDate = new Date(event_date);
      if (Number.isNaN(parsedDate.getTime())) {
        return "event_date must be a valid date";
      }
      event.event_date = parsedDate;
    }
  }

  if (time !== undefined) {
    event.time = time;
  }

  if (duration_minutes !== undefined) {
    const normalizedDuration = normalizeDurationMinutes(duration_minutes);
    if (!normalizedDuration) {
      return "duration_minutes must be an integer between 1 and 1440";
    }

    event.duration_minutes = normalizedDuration;
  }

  if (capacity !== undefined) {
    if (capacity === null || capacity === "") {
      event.capacity = undefined;
    } else {
      const normalizedCapacity = Number(capacity);
      if (!Number.isInteger(normalizedCapacity) || normalizedCapacity < 1) {
        return "capacity must be a positive integer";
      }
      event.capacity = normalizedCapacity;
    }
  }

  if (category !== undefined) {
    event.category = category;
  }

  if (payload.tags !== undefined || category !== undefined) {
    event.tags = normalizedTags;
    if (!event.category && normalizedTags[0]) {
      event.category = normalizedTags[0];
    }
  }

  if (image_url !== undefined) {
    event.image_url = image_url;
  }

  return null;
};

const canReadEvent = (event, user) => {
  if (PUBLIC_EVENT_STATUSES.includes(event.status)) {
    return true;
  }

  if (!user || !user.id) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  return String(event.created_by) === String(user.id);
};

const buildEventListQuery = (user) => {
  if (!user || !user.id) {
    return { status: { $in: PUBLIC_EVENT_STATUSES } };
  }

  if (isAdmin(user)) {
    return {};
  }

  return {
    $or: [
      { status: { $in: PUBLIC_EVENT_STATUSES } },
      { created_by: user.id }
    ]
  };
};

exports.uploadEventImage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    if (!req.file) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Image file is required"
      });
    }

    const config = getConfig();

    if (config.imageStorage === "cloudinary") {
      if (!req.file.buffer) {
        return sendError(res, {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "Cloud image upload requires a valid file"
        });
      }

      const uploaded = await uploadBufferToCloudinary({
        fileBuffer: req.file.buffer,
        folder: config.cloudinary.folder,
        originalFilename: req.file.originalname
      });

      return sendSuccess(res, {
        status: 201,
        message: "Image uploaded",
        data: {
          image_url: uploaded.secure_url,
          file_path: null,
          provider: "cloudinary",
          public_id: uploaded.public_id
        }
      });
    }

    const fileName = req.file.filename || path.basename(req.file.path || "");
    const filePath = `/uploads/events/${fileName}`;

    return sendSuccess(res, {
      status: 201,
      message: "Image uploaded",
      data: {
        image_url: filePath,
        file_path: filePath,
        provider: "local"
      }
    });
  } catch (err) {
    return sendError(res, {
      status: 500,
      code: "UPLOAD_FAILED",
      message: "Error uploading image"
    });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      event_date,
      time,
      duration_minutes,
      capacity,
      category,
      image_url,
      status
    } = req.body;

    if (!title) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "title is required"
      });
    }

    if (!req.user || !req.user.id) {
      return sendError(res, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const parsedDate = event_date ? new Date(event_date) : null;
    if (event_date && Number.isNaN(parsedDate.getTime())) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "event_date must be a valid date"
      });
    }

    const normalizedCapacity =
      capacity === undefined || capacity === null || capacity === ""
        ? undefined
        : Number(capacity);
    const normalizedDuration = normalizeDurationMinutes(duration_minutes);

    if (normalizedCapacity !== undefined) {
      if (!Number.isInteger(normalizedCapacity) || normalizedCapacity < 1) {
        return sendError(res, {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "capacity must be a positive integer"
        });
      }
    }

    if (!normalizedDuration) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "duration_minutes must be an integer between 1 and 1440"
      });
    }

    const normalizedTags = normalizeTags(req.body.tags, category);
    const effectiveStatus = isAdmin(req.user) ? (status || "Published") : REVIEWABLE_EVENT_STATUS;

    const event = new Event({
      title,
      description,
      location,
      event_date: parsedDate,
      time,
      duration_minutes: normalizedDuration,
      capacity: normalizedCapacity,
      category: category || normalizedTags[0] || undefined,
      tags: normalizedTags,
      image_url,
      status: effectiveStatus,
      created_by: req.user.id,
      submitted_at: new Date(),
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      attending_count: 0
    });

    await event.save();

    if (!isAdmin(req.user)) {
      await createNotificationSafely({
        user_id: req.user.id,
        type: "info",
        title: "Event submitted",
        message: `${event.title || "Your event"} is pending admin review`,
        event_id: event._id
      });
    } else if (event.status === "Published") {
      await notifyInterestedUsersOnPublish({
        event,
        excludeUserId: req.user.id
      });
    }

    return sendSuccess(res, {
      status: 201,
      message: effectiveStatus === "Pending" ? "Event submitted for review" : "Event created",
      data: serializeEvent(event, 0)
    });

  } catch (err) {
    // Return a 400 for client-side validation/cast errors from Mongoose
    if (
      err instanceof mongoose.Error.ValidationError ||
      err instanceof mongoose.Error.CastError ||
      err.name === "ValidationError" ||
      err.name === "CastError"
    ) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Invalid event data",
        details: err.message
      });
    }
    return sendError(res, {
      status: 500,
      code: "EVENT_CREATE_FAILED",
      message: "Error creating event"
    });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const query = buildEventListQuery(req.user);
    const events = await Event.find(query).sort({ event_date: 1, created_at: -1 });
    const eventsWithAttending = await Promise.all(
      events.map(async (event) => {
        const lifecycle = reconcileLifecycleStatus({ event });
        if (lifecycle.changed) {
          await event.save();
        }

        if (!canReadEvent(event, req.user)) {
          return null;
        }

        const attending = Number.isInteger(event.attending_count)
          ? event.attending_count
          : await RSVP.countDocuments({ event_id: event._id });

        return serializeEvent(event, attending);
      })
    );

    const visibleEvents = eventsWithAttending.filter(Boolean);

    return sendSuccess(res, {
      status: 200,
      message: "Events fetched",
      data: visibleEvents
    });
  } catch (err) {
    return sendError(res, {
      status: 500,
      code: "EVENT_FETCH_FAILED",
      message: "Error fetching events"
    });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return sendError(res, {
        status: 404,
        code: "EVENT_NOT_FOUND",
        message: "Event not found"
      });
    }

    const lifecycle = reconcileLifecycleStatus({ event });
    if (lifecycle.changed) {
      await event.save();
    }

    if (!canReadEvent(event, req.user)) {
      return sendError(res, {
        status: 404,
        code: "EVENT_NOT_FOUND",
        message: "Event not found"
      });
    }

    const attending = Number.isInteger(event.attending_count)
      ? event.attending_count
      : await RSVP.countDocuments({ event_id: event._id });

    return sendSuccess(res, {
      status: 200,
      message: "Event fetched",
      data: serializeEvent(event, attending)
    });
  } catch (err) {
    return sendError(res, {
      status: 500,
      code: "EVENT_FETCH_FAILED",
      message: "Error fetching event"
    });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    let previousStatus = null;

    if (!req.user || !req.user.id) {
      return sendError(res, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const event = await Event.findById(id);
    previousStatus = event ? event.status : null;

    if (!event) {
      return sendError(res, {
        status: 404,
        code: "EVENT_NOT_FOUND",
        message: "Event not found"
      });
    }

    if (!isAdmin(req.user) && String(event.created_by) !== String(req.user.id)) {
      return sendError(res, {
        status: 403,
        code: "FORBIDDEN",
        message: "Forbidden. You can only update your own events"
      });
    }

    const validationMessage = applyEventFields(event, req.body || {});
    if (validationMessage) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: validationMessage
      });
    }

    if (req.body.status !== undefined) {
      if (!isAdmin(req.user) && String(req.body.status) !== String(event.status)) {
        return sendError(res, {
          status: 403,
          code: "FORBIDDEN",
          message: "Only admins can change event status directly"
        });
      }

      if (isAdmin(req.user)) {
        event.status = req.body.status;

        if (req.body.status === "Rejected") {
          event.rejection_reason = req.body.rejection_reason || event.rejection_reason;
        } else {
          event.rejection_reason = null;
        }

        event.reviewed_by = req.user.id;
        event.reviewed_at = new Date();
      }
    }

    await event.save();

    if (event.status === "Published" && previousStatus !== "Published") {
      await notifyInterestedUsersOnPublish({
        event,
        excludeUserId: req.user.id
      });
    }

    return sendSuccess(res, {
      status: 200,
      message: "Event updated",
      data: serializeEvent(event, Number.isInteger(event.attending_count) ? event.attending_count : 0)
    });
  } catch (err) {
    if (
      err instanceof mongoose.Error.ValidationError ||
      err instanceof mongoose.Error.CastError ||
      err.name === "ValidationError" ||
      err.name === "CastError"
    ) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Invalid event data",
        details: err.message
      });
    }

    return sendError(res, {
      status: 500,
      code: "EVENT_UPDATE_FAILED",
      message: "Error updating event"
    });
  }
};

exports.getPendingReviewEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: REVIEWABLE_EVENT_STATUS })
      .populate("created_by", "name student_id email role")
      .sort({ submitted_at: 1, created_at: 1 });

    const eventsWithAttending = await Promise.all(
      events.map(async (event) => {
        const attending = Number.isInteger(event.attending_count)
          ? event.attending_count
          : await RSVP.countDocuments({ event_id: event._id });

        return serializeEvent(event, attending);
      })
    );

    return sendSuccess(res, {
      status: 200,
      message: "Pending review events fetched",
      data: eventsWithAttending
    });
  } catch (err) {
    return sendError(res, {
      status: 500,
      code: "EVENT_FETCH_FAILED",
      message: "Error fetching pending review events"
    });
  }
};

exports.getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalEvents,
      pendingEvents,
      publishedEvents,
      ongoingEvents,
      completedEvents,
      rejectedEvents,
      cancelledEvents,
      totalRsvps
    ] = await Promise.all([
      Event.countDocuments({}),
      Event.countDocuments({ status: REVIEWABLE_EVENT_STATUS }),
      Event.countDocuments({ status: "Published" }),
      Event.countDocuments({ status: "Ongoing" }),
      Event.countDocuments({ status: "Completed" }),
      Event.countDocuments({ status: "Rejected" }),
      Event.countDocuments({ status: "Cancelled" }),
      RSVP.countDocuments({})
    ]);

    return sendSuccess(res, {
      status: 200,
      message: "Admin dashboard stats fetched",
      data: {
        total_events: totalEvents,
        pending_events: pendingEvents,
        published_events: publishedEvents,
        ongoing_events: ongoingEvents,
        completed_events: completedEvents,
        rejected_events: rejectedEvents,
        cancelled_events: cancelledEvents,
        total_rsvps: totalRsvps
      }
    });
  } catch (err) {
    return sendError(res, {
      status: 500,
      code: "EVENT_STATS_FETCH_FAILED",
      message: "Error fetching admin dashboard stats"
    });
  }
};

exports.reviewEventSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body || {};

    const event = await Event.findById(id);

    if (!event) {
      return sendError(res, {
        status: 404,
        code: "EVENT_NOT_FOUND",
        message: "Event not found"
      });
    }

    if (event.status !== REVIEWABLE_EVENT_STATUS) {
      return sendError(res, {
        status: 409,
        code: "INVALID_EVENT_STATE",
        message: "Only pending events can be reviewed"
      });
    }

    const reviewedAt = new Date();
    event.reviewed_by = req.user.id;
    event.reviewed_at = reviewedAt;

    if (decision === "approve") {
      event.status = "Published";
      event.rejection_reason = null;

      await createNotificationSafely({
        user_id: event.created_by,
        type: "success",
        title: "Event approved",
        message: `${event.title || "Your event"} has been approved and published`,
        event_id: event._id
      });
    } else {
      const trimmedReason = String(reason || "").trim();
      event.status = "Rejected";
      event.rejection_reason = trimmedReason;

      await createNotificationSafely({
        user_id: event.created_by,
        type: "warning",
        title: "Event needs changes",
        message: `${event.title || "Your event"} was rejected: ${trimmedReason}`,
        event_id: event._id
      });
    }

    await event.save();

    if (decision === "approve" && event.status === "Published") {
      await notifyInterestedUsersOnPublish({
        event,
        excludeUserId: event.created_by
      });
    }

    const attending = Number.isInteger(event.attending_count)
      ? event.attending_count
      : await RSVP.countDocuments({ event_id: event._id });

    return sendSuccess(res, {
      status: 200,
      message: decision === "approve" ? "Event approved" : "Event rejected",
      data: serializeEvent(event, attending)
    });
  } catch (err) {
    return sendError(res, {
      status: 500,
      code: "EVENT_REVIEW_FAILED",
      message: "Error reviewing event submission"
    });
  }
};

exports.resubmitEventForReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return sendError(res, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return sendError(res, {
        status: 404,
        code: "EVENT_NOT_FOUND",
        message: "Event not found"
      });
    }

    if (String(event.created_by) !== String(req.user.id)) {
      return sendError(res, {
        status: 403,
        code: "FORBIDDEN",
        message: "Forbidden. You can only resubmit your own events"
      });
    }

    if (event.status !== "Rejected") {
      return sendError(res, {
        status: 409,
        code: "INVALID_EVENT_STATE",
        message: "Only rejected events can be resubmitted"
      });
    }

    const validationMessage = applyEventFields(event, req.body || {});
    if (validationMessage) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: validationMessage
      });
    }

    event.status = REVIEWABLE_EVENT_STATUS;
    event.submitted_at = new Date();
    event.rejection_reason = null;
    event.reviewed_by = null;
    event.reviewed_at = null;

    await event.save();

    await createNotificationSafely({
      user_id: req.user.id,
      type: "info",
      title: "Event resubmitted",
      message: `${event.title || "Your event"} was resubmitted for admin review`,
      event_id: event._id
    });

    const attending = Number.isInteger(event.attending_count)
      ? event.attending_count
      : await RSVP.countDocuments({ event_id: event._id });

    return sendSuccess(res, {
      status: 200,
      message: "Event resubmitted for review",
      data: serializeEvent(event, attending)
    });
  } catch (err) {
    return sendError(res, {
      status: 500,
      code: "EVENT_RESUBMIT_FAILED",
      message: "Error resubmitting event"
    });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user.id) {
      return sendError(res, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return sendError(res, {
        status: 404,
        code: "EVENT_NOT_FOUND",
        message: "Event not found"
      });
    }

    if (!isAdmin(req.user) && String(event.created_by) !== String(req.user.id)) {
      return sendError(res, {
        status: 403,
        code: "FORBIDDEN",
        message: "Forbidden. You can only delete your own events"
      });
    }

    await Event.deleteOne({ _id: id });
    await RSVP.deleteMany({ event_id: id });

    return sendSuccess(res, {
      status: 200,
      message: "Event deleted",
      data: null
    });
  } catch (err) {
    return sendError(res, {
      status: 500,
      code: "EVENT_DELETE_FAILED",
      message: "Error deleting event"
    });
  }
};