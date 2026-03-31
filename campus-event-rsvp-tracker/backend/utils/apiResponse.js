const sendSuccess = (res, { status = 200, message = "OK", data = null, meta } = {}) => {
  const payload = {
    success: true,
    message,
    data
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(status).json(payload);
};

const sendError = (
  res,
  {
    status = 500,
    code = "INTERNAL_ERROR",
    message = "Internal server error",
    details
  } = {}
) => {
  const payload = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (details !== undefined) {
    payload.error.details = details;
  }

  return res.status(status).json(payload);
};

module.exports = {
  sendSuccess,
  sendError
};
