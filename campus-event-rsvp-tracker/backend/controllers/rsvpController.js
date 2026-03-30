const mongoose = require("mongoose");
const RSVP = require("../models/rsvp");
const Event = require("../models/event");

exports.createRsvp = async (req, res) => {
  try {
    const { event_id } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!event_id || !mongoose.Types.ObjectId.isValid(event_id)) {
      return res.status(400).json({ message: "Valid event_id is required" });
    }

    const event = await Event.findById(event_id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.capacity) {
      const attendingCount = await RSVP.countDocuments({ event_id });
      if (attendingCount >= event.capacity) {
        return res.status(409).json({ message: "Event is full" });
      }
    }

    const rsvp = new RSVP({
      user_id: req.user.id,
      event_id,
      status: "Confirmed"
    });

    await rsvp.save();

    return res.status(201).json({
      message: "RSVP created",
      data: rsvp
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: "You have already RSVPed to this event" });
    }

    return res.status(500).json({ message: "Error creating RSVP" });
  }
};

exports.cancelRsvp = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const deleted = await RSVP.findOneAndDelete({
      user_id: req.user.id,
      event_id: eventId
    });

    if (!deleted) {
      return res.status(404).json({ message: "RSVP not found" });
    }

    return res.status(200).json({ message: "RSVP cancelled" });
  } catch (error) {
    return res.status(500).json({ message: "Error cancelling RSVP" });
  }
};

exports.getMyRsvps = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const rsvps = await RSVP.find({ user_id: req.user.id })
      .populate("event_id")
      .sort({ rsvp_date: -1 });

    const data = await Promise.all(
      rsvps
        .filter((rsvp) => rsvp.event_id)
        .map(async (rsvp) => {
          const attending = await RSVP.countDocuments({ event_id: rsvp.event_id._id });

          return {
            rsvp_id: rsvp._id,
            status: rsvp.status,
            rsvp_date: rsvp.rsvp_date,
            event: {
              ...rsvp.event_id.toObject(),
              attending
            }
          };
        })
    );

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching RSVPs" });
  }
};
