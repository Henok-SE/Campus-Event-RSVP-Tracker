const Event = require("../models/event");
const RSVP = require("../models/rsvp");
const mongoose = require("mongoose");

exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, event_date, time, capacity, category, image_url, status } = req.body;

    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsedDate = event_date ? new Date(event_date) : null;
    if (event_date && Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "event_date must be a valid date" });
    }

    const normalizedCapacity =
      capacity === undefined || capacity === null || capacity === ""
        ? undefined
        : Number(capacity);

    if (normalizedCapacity !== undefined) {
      if (!Number.isInteger(normalizedCapacity) || normalizedCapacity < 1) {
        return res.status(400).json({ message: "capacity must be a positive integer" });
      }
    }

    const event = new Event({
      title,
      description,
      location,
      event_date: parsedDate,
      time,
      capacity: normalizedCapacity,
      category,
      image_url,
      status,
      created_by: req.user.id
    });

    await event.save();

    return res.status(201).json({
      message: "Event created",
      data: event
    });

  } catch (err) {
    // Return a 400 for client-side validation/cast errors from Mongoose
    if (
      err instanceof mongoose.Error.ValidationError ||
      err instanceof mongoose.Error.CastError ||
      err.name === "ValidationError" ||
      err.name === "CastError"
    ) {
      return res.status(400).json({
        message: "Invalid event data",
        details: err.message
      });
    }
    return res.status(500).json({ message: "Error creating event" });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ event_date: 1, created_at: -1 });
    const eventsWithAttending = await Promise.all(
      events.map(async (event) => {
        const attending = await RSVP.countDocuments({ event_id: event._id });
        return {
          ...event.toObject(),
          attending
        };
      })
    );

    return res.status(200).json({ data: eventsWithAttending });
  } catch (err) {
    return res.status(500).json({ message: "Error fetching events" });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const attending = await RSVP.countDocuments({ event_id: event._id });

    return res.status(200).json({
      data: {
        ...event.toObject(),
        attending
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Error fetching event" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (String(event.created_by) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden. You can only update your own events" });
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

    if (title !== undefined) {
      if (!title || !String(title).trim()) {
        return res.status(400).json({ message: "title cannot be empty" });
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
          return res.status(400).json({ message: "event_date must be a valid date" });
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
          return res.status(400).json({ message: "capacity must be a positive integer" });
        }
        event.capacity = normalizedCapacity;
      }
    }

    if (category !== undefined) {
      event.category = category;
    }

    if (image_url !== undefined) {
      event.image_url = image_url;
    }

    if (status !== undefined) {
      event.status = status;
    }

    await event.save();

    return res.status(200).json({
      message: "Event updated",
      data: event
    });
  } catch (err) {
    if (
      err instanceof mongoose.Error.ValidationError ||
      err instanceof mongoose.Error.CastError ||
      err.name === "ValidationError" ||
      err.name === "CastError"
    ) {
      return res.status(400).json({
        message: "Invalid event data",
        details: err.message
      });
    }

    return res.status(500).json({ message: "Error updating event" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (String(event.created_by) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden. You can only delete your own events" });
    }

    await Event.deleteOne({ _id: id });
    await RSVP.deleteMany({ event_id: id });

    return res.status(200).json({ message: "Event deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Error deleting event" });
  }
};