const Event = require("../models/event");

exports.createEvent = async (req, res) => {
  try {
    console.log("🔥 CREATE EVENT HIT");
    console.log("BODY:", req.body);
    console.log("USER:", req.user);
     if (!req.body.title) {
      return res.status(400).json({ message: "Event title is required" });
     }
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
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("created_by", "name email");

    res.json(events);
    

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};