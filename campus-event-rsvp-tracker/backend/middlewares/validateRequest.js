const mongoose = require("mongoose");
const { sendError } = require("../utils/apiResponse");

const validateRequired = (fields = []) => (req, res, next) => {
  const missing = fields.filter((field) => {
    const value = req.body?.[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    return sendError(res, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Missing required fields",
      details: { missing }
    });
  }

  return next();
};

const validateObjectIdParam = (paramName) => (req, res, next) => {
  const value = req.params?.[paramName];
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return sendError(res, {
      status: 400,
      code: "INVALID_ID",
      message: `Invalid ${paramName}`
    });
  }

  return next();
};

const validateEventBody = ({ partial = false } = {}) => (req, res, next) => {
  const { title, event_date, capacity, status, tags } = req.body || {};
  const allowedStatuses = ["Draft", "Published", "Ongoing", "Completed", "Cancelled"];

  if (!partial && (title === undefined || String(title).trim() === "")) {
    return sendError(res, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "title is required"
    });
  }

  if (title !== undefined && String(title).trim() === "") {
    return sendError(res, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "title cannot be empty"
    });
  }

  if (event_date !== undefined && event_date !== null && event_date !== "") {
    const parsedDate = new Date(event_date);
    if (Number.isNaN(parsedDate.getTime())) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "event_date must be a valid date"
      });
    }
  }

  if (capacity !== undefined && capacity !== null && capacity !== "") {
    const normalizedCapacity = Number(capacity);
    if (!Number.isInteger(normalizedCapacity) || normalizedCapacity < 1) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "capacity must be a positive integer"
      });
    }
  }

  if (status !== undefined && !allowedStatuses.includes(status)) {
    return sendError(res, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "status is invalid",
      details: { allowedStatuses }
    });
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string" || !tag.trim())) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "tags must be an array of non-empty strings"
      });
    }
  }

  return next();
};

const validateRsvpBody = (req, res, next) => {
  const { event_id } = req.body || {};

  if (!event_id || !mongoose.Types.ObjectId.isValid(event_id)) {
    return sendError(res, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Valid event_id is required"
    });
  }

  return next();
};

module.exports = {
  validateRequired,
  validateObjectIdParam,
  validateEventBody,
  validateRsvpBody
};
