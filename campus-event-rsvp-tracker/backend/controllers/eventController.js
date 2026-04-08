const Event = require("../models/event");
const RSVP = require("../models/rsvp");
const mongoose = require("mongoose");
const { sendSuccess, sendError } = require("../utils/apiResponse");

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

  return {
    ...event,
    category: event.category || tags[0] || null,
    tags,
    attending: attendingCount
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

    const filePath = `/uploads/events/${req.file.filename}`;
    const imageUrl = `${req.protocol}://${req.get("host")}${filePath}`;

    return sendSuccess(res, {
      status: 201,
      message: "Image uploaded",
      data: {
        image_url: imageUrl,
        file_path: filePath
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
    const { title, description, location, event_date, time, capacity, category, image_url, status } = req.body;

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

    if (normalizedCapacity !== undefined) {
      if (!Number.isInteger(normalizedCapacity) || normalizedCapacity < 1) {
        return sendError(res, {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "capacity must be a positive integer"
        });
      }
    }

    const normalizedTags = normalizeTags(req.body.tags, category);

    const event = new Event({
      title,
      description,
      location,
      event_date: parsedDate,
      time,
      capacity: normalizedCapacity,
      category: category || normalizedTags[0] || undefined,
      tags: normalizedTags,
      image_url,
      status,
      created_by: req.user.id,
      attending_count: 0
    });

    await event.save();

    return sendSuccess(res, {
      status: 201,
      message: "Event created",
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
    const events = await Event.find().sort({ event_date: 1, created_at: -1 });
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
      message: "Events fetched",
      data: eventsWithAttending
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
        message: "Forbidden. You can only update your own events"
      });
    }

    const {
      title,
      description,
      location,
      event_date,
      time,
      capacity,
      category,
      image_url,
      status
    } = req.body;

    const normalizedTags = normalizeTags(req.body.tags, category ?? event.category);

    if (title !== undefined) {
      if (!title || !String(title).trim()) {
        return sendError(res, {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "title cannot be empty"
        });
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
          return sendError(res, {
            status: 400,
            code: "VALIDATION_ERROR",
            message: "event_date must be a valid date"
          });
        }
        event.event_date = parsedDate;
      }
    }

    if (time !== undefined) {
      event.time = time;
    }

    if (capacity !== undefined) {
      if (capacity === null || capacity === "") {
        event.capacity = undefined;
      } else {
        const normalizedCapacity = Number(capacity);
        if (!Number.isInteger(normalizedCapacity) || normalizedCapacity < 1) {
          return sendError(res, {
            status: 400,
            code: "VALIDATION_ERROR",
            message: "capacity must be a positive integer"
          });
        }
        event.capacity = normalizedCapacity;
      }
    }

    if (category !== undefined) {
      event.category = category;
    }

    if (req.body.tags !== undefined || category !== undefined) {
      event.tags = normalizedTags;
      if (!event.category && normalizedTags[0]) {
        event.category = normalizedTags[0];
      }
    }

    if (image_url !== undefined) {
      event.image_url = image_url;
    }

    if (status !== undefined) {
      event.status = status;
    }

    await event.save();

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

    if (String(event.created_by) !== String(req.user.id)) {
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