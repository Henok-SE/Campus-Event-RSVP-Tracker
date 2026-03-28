const Event = require("../models/event");

exports.createEvent = async (req, res) => {
  try {
    const event = new Event({
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      event_date: req.body.event_date,
      created_by: req.user.id
    });

    await event.save();

    res.json({ message: "Event created", event });

  } catch (err) {
    res.status(500).json({ message: "Error creating event" });
  }
};