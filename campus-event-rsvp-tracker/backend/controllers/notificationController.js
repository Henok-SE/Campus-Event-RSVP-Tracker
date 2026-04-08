const mongoose = require("mongoose");
const Notification = require("../models/notification");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const toDto = (doc) => {
  const notification = doc && doc.toObject ? doc.toObject() : doc;

  return {
    id: String(notification._id),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: Boolean(notification.read),
    event_id: notification.event_id ? String(notification.event_id) : null,
    created_at: notification.created_at
  };
};

exports.listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .lean();

    return sendSuccess(res, {
      status: 200,
      message: "Notifications fetched",
      data: notifications.map((item) => toDto(item))
    });
  } catch (error) {
    return sendError(res, {
      status: 500,
      code: "NOTIFICATION_FETCH_FAILED",
      message: "Failed to fetch notifications"
    });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { type, title, message, event_id, read } = req.body || {};

    const trimmedMessage = String(message || "").trim();

    if (!trimmedMessage) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "message is required"
      });
    }

    if (event_id && !mongoose.Types.ObjectId.isValid(event_id)) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "event_id is invalid"
      });
    }

    const created = await Notification.create({
      user_id: req.user.id,
      type,
      title,
      message: trimmedMessage,
      read: Boolean(read),
      event_id: event_id || null
    });

    return sendSuccess(res, {
      status: 201,
      message: "Notification created",
      data: toDto(created)
    });
  } catch (error) {
    return sendError(res, {
      status: 500,
      code: "NOTIFICATION_CREATE_FAILED",
      message: "Failed to create notification"
    });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Invalid notification id"
      });
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: id, user_id: req.user.id },
      { $set: { read: true } },
      { returnDocument: "after" }
    );

    if (!updated) {
      return sendError(res, {
        status: 404,
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found"
      });
    }

    return sendSuccess(res, {
      status: 200,
      message: "Notification marked as read",
      data: toDto(updated)
    });
  } catch (error) {
    return sendError(res, {
      status: 500,
      code: "NOTIFICATION_UPDATE_FAILED",
      message: "Failed to update notification"
    });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user_id: req.user.id, read: false },
      { $set: { read: true } }
    );

    return sendSuccess(res, {
      status: 200,
      message: "Notifications marked as read",
      data: {
        updated_count: Number(result.modifiedCount || 0)
      }
    });
  } catch (error) {
    return sendError(res, {
      status: 500,
      code: "NOTIFICATION_UPDATE_FAILED",
      message: "Failed to update notifications"
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Invalid notification id"
      });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      user_id: req.user.id
    });

    if (!deleted) {
      return sendError(res, {
        status: 404,
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found"
      });
    }

    return sendSuccess(res, {
      status: 200,
      message: "Notification deleted",
      data: null
    });
  } catch (error) {
    return sendError(res, {
      status: 500,
      code: "NOTIFICATION_DELETE_FAILED",
      message: "Failed to delete notification"
    });
  }
};