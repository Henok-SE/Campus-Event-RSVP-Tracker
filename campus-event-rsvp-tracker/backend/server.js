const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { sendError, sendSuccess } = require("./utils/apiResponse");
const { getConfig } = require("./config/env");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const rsvpRoutes = require("./routes/rsvpRoutes");

const app = express();
const config = getConfig();

const allowedOrigins = config.frontendOrigins;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS not allowed for this origin"));
  },
  credentials: true
}));
app.use(helmet());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);

app.get("/", (req, res) => {
  return sendSuccess(res, {
    status: 200,
    message: "Server is working",
    data: null
  });
});

app.get("/api/health", (req, res) => {
  return sendSuccess(res, {
    status: 200,
    message: "Health check passed",
    data: { status: "ok" }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/rsvp", rsvpRoutes);

app.use((req, res) => {
  return sendError(res, {
    status: 404,
    code: "NOT_FOUND",
    message: "Route not found"
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  return sendError(res, {
    status: err.statusCode || 500,
    code: err.code || "INTERNAL_ERROR",
    message: err.message || "Internal server error",
    details: err.details
  });
});

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("Database connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

const PORT = config.port;

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

module.exports = { app, connectDB };
