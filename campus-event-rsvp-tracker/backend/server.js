const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const { sendError, sendSuccess } = require("./utils/apiResponse");
const { getConfig } = require("./config/env");
const Student = require("./models/student");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const rsvpRoutes = require("./routes/rsvpRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const config = getConfig();
let serverInstance = null;

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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
app.use("/api/notifications", notificationRoutes);

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

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "Image size must be 5MB or less"
      : err.message || "Upload failed";

    return sendError(res, {
      status: 400,
      code: "UPLOAD_ERROR",
      message
    });
  }

  if (err && /Only JPG, PNG, WEBP, and GIF images are allowed/i.test(err.message || "")) {
    return sendError(res, {
      status: 400,
      code: "UPLOAD_ERROR",
      message: err.message
    });
  }

  return sendError(res, {
    status: err.statusCode || 500,
    code: err.code || "INTERNAL_ERROR",
    message: err.message || "Internal server error",
    details: err.details
  });
});

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || config.mongoUri;

  try {
    await mongoose.connect(mongoUri);
    console.log("Database connected");

    try {
      const studentCount = await Student.countDocuments();
      if (studentCount === 0) {
        console.warn(
          "Student roster is empty. Run: npm --prefix backend run db:import:students:finalized:replace"
        );
      }
    } catch (warnErr) {
      console.warn(`Student roster check skipped: ${warnErr.message}`);
    }
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

const PORT = config.port;

const startServer = async () => {
  await connectDB();

  serverInstance = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (image storage: ${config.imageStorage})`);
  });
};

const shutdown = (signal) => {
  console.log(`${signal} received. Starting graceful shutdown...`);

  const forceExitTimer = setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);

  forceExitTimer.unref();

  const closeDatabase = async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
      }
      console.log("MongoDB connection closed");
      process.exit(0);
    } catch (error) {
      console.error(`Shutdown error: ${error.message}`);
      process.exit(1);
    }
  };

  if (serverInstance) {
    serverInstance.close(() => {
      closeDatabase();
    });
    return;
  }

  closeDatabase();
};

if (require.main === module) {
  startServer();

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

module.exports = { app, connectDB };
