const Event = require("../models/event");
const mongoose = require("mongoose");

exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, event_date, status } = req.body;

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

    const event = new Event({
      title,
      description,
      location,
      event_date: parsedDate,
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
    return res.status(200).json({ data: events });
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

    return res.status(200).json({ data: event });
  } catch (err) {
    return res.status(500).json({ message: "Error fetching event" });
  }
};