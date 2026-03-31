const mongoose = require("mongoose");
const RSVP = require("../models/rsvp");
const Event = require("../models/event");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const CLOSED_EVENT_STATUSES = ["Cancelled", "Completed"];

const isClosedStatus = (status) => CLOSED_EVENT_STATUSES.includes(status);

exports.createRsvp = async (req, res) => {
  let incrementedAttendance = false;

  try {
    const { event_id } = req.body;

    if (!req.user || !req.user.id) {
      return sendError(res, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    if (!event_id || !mongoose.Types.ObjectId.isValid(event_id)) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Valid event_id is required"
      });
    }

    const existingRsvp = await RSVP.findOne({
      user_id: req.user.id,
      event_id
    });

    if (existingRsvp) {
      return sendError(res, {
        status: 409,
        code: "DUPLICATE_RSVP",
        message: "You have already RSVPed to this event"
      });
    }

    const event = await Event.findById(event_id);

    if (!event) {
      return sendError(res, {
        status: 404,
        code: "EVENT_NOT_FOUND",
        message: "Event not found"
      });
    }

    if (isClosedStatus(event.status)) {
      return sendError(res, {
        status: 409,
        code: "EVENT_UNAVAILABLE",
        message: "Cannot RSVP to cancelled or completed events"
      });
    }

    let updatedEvent = null;

    if (event.capacity) {
      updatedEvent = await Event.findOneAndUpdate(
        {
          _id: event_id,
          status: { $nin: CLOSED_EVENT_STATUSES },
          $expr: { $lt: [{ $ifNull: ["$attending_count", 0] }, event.capacity] }
        },
        { $inc: { attending_count: 1 } },
        { returnDocument: "after" }
      );

      if (!updatedEvent) {
        return sendError(res, {
          status: 409,
          code: "EVENT_FULL",
          message: "Event is full"
        });
      }
    } else {
      updatedEvent = await Event.findOneAndUpdate(
        {
          _id: event_id,
          status: { $nin: CLOSED_EVENT_STATUSES }
        },
        { $inc: { attending_count: 1 } },
        { returnDocument: "after" }
      );

      if (!updatedEvent) {
        return sendError(res, {
          status: 409,
          code: "EVENT_UNAVAILABLE",
          message: "Event is unavailable for RSVP"
        });
      }
    }

    incrementedAttendance = true;

    const rsvp = new RSVP({
      user_id: req.user.id,
      event_id,
      status: "Confirmed"
    });

    await rsvp.save();

    return sendSuccess(res, {
      status: 201,
      message: "RSVP created",
      data: rsvp
    });
  } catch (error) {
    if (incrementedAttendance) {
      await Event.updateOne(
        { _id: req.body.event_id, attending_count: { $gt: 0 } },
        { $inc: { attending_count: -1 } }
      );
    }

    if (error && error.code === 11000) {
      return sendError(res, {
        status: 409,
        code: "DUPLICATE_RSVP",
        message: "You have already RSVPed to this event"
      });
    }

    return sendError(res, {
      status: 500,
      code: "RSVP_CREATE_FAILED",
      message: "Error creating RSVP"
    });
  }
};

exports.cancelRsvp = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!req.user || !req.user.id) {
      return sendError(res, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return sendError(res, {
        status: 400,
        code: "INVALID_ID",
        message: "Invalid event id"
      });
    }

    const deleted = await RSVP.findOneAndDelete({
      user_id: req.user.id,
      event_id: eventId
    });

    if (!deleted) {
      return sendError(res, {
        status: 404,
        code: "RSVP_NOT_FOUND",
        message: "RSVP not found"
      });
    }

    await Event.updateOne(
      { _id: eventId, attending_count: { $gt: 0 } },
      { $inc: { attending_count: -1 } }
    );

    return sendSuccess(res, {
      status: 200,
      message: "RSVP cancelled",
      data: null
    });
  } catch (error) {
    return sendError(res, {
      status: 500,
      code: "RSVP_CANCEL_FAILED",
      message: "Error cancelling RSVP"
    });
  }
};

exports.getMyRsvps = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      });
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
              attending,
              tags:
                Array.isArray(rsvp.event_id.tags) && rsvp.event_id.tags.length > 0
                  ? rsvp.event_id.tags
                  : rsvp.event_id.category
                    ? [rsvp.event_id.category]
                    : []
            }
          };
        })
    );

    return sendSuccess(res, {
      status: 200,
      message: "RSVPs fetched",
      data
    });
  } catch (error) {
    return sendError(res, {
      status: 500,
      code: "RSVP_FETCH_FAILED",
      message: "Error fetching RSVPs"
    });
  }
};
