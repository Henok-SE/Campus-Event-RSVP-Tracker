const path = require("path");
const dotenv = require("dotenv");

const DEFAULT_PORT = 5050;
const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/eventDB";
const DEFAULT_FRONTEND_ORIGINS = "http://localhost:5173";
const DEFAULT_IMAGE_STORAGE = "local";
const DEFAULT_CLOUDINARY_FOLDER = "campus-event-rsvp/events";
const IMAGE_STORAGE_MODES = new Set(["local", "cloudinary"]);
const REQUIRED_VARS = ["JWT_SECRET"];
const CLOUDINARY_REQUIRED_VARS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
];

if (process.env.NODE_ENV !== "test") {
  dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
}

const parsePort = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return DEFAULT_PORT;
};

const parseOrigins = (value) => {
  return (value || DEFAULT_FRONTEND_ORIGINS)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const parseImageStorage = (value) => {
  const normalized = String(value || DEFAULT_IMAGE_STORAGE).trim().toLowerCase();
  return IMAGE_STORAGE_MODES.has(normalized) ? normalized : DEFAULT_IMAGE_STORAGE;
};

const getMissingRequiredVars = () => {
  const missingBaseVars = REQUIRED_VARS.filter((key) => {
    const value = process.env[key];
    return !value || !String(value).trim();
  });

  const imageStorage = parseImageStorage(process.env.IMAGE_STORAGE);
  if (imageStorage !== "cloudinary") {
    return missingBaseVars;
  }

  const missingCloudinaryVars = CLOUDINARY_REQUIRED_VARS.filter((key) => {
    const value = process.env[key];
    return !value || !String(value).trim();
  });

  return [...missingBaseVars, ...missingCloudinaryVars];
};

const validateEnv = () => {
  const missingVars = getMissingRequiredVars();

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}. Set them in backend/.env (see backend/.env.example).`
    );
  }
};

const getConfig = () => {
  validateEnv();
  const imageStorage = parseImageStorage(process.env.IMAGE_STORAGE);

  return {
    port: parsePort(process.env.PORT),
    mongoUri: (process.env.MONGODB_URI || DEFAULT_MONGODB_URI).trim() || DEFAULT_MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET.trim(),
    frontendOrigins: parseOrigins(process.env.FRONTEND_ORIGINS),
    imageStorage,
    cloudinary: {
      cloudName: (process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
      apiKey: (process.env.CLOUDINARY_API_KEY || "").trim(),
      apiSecret: (process.env.CLOUDINARY_API_SECRET || "").trim(),
      folder: (process.env.CLOUDINARY_FOLDER || DEFAULT_CLOUDINARY_FOLDER).trim() || DEFAULT_CLOUDINARY_FOLDER
    }
  };
};

module.exports = {
  getConfig,
  validateEnv
};
