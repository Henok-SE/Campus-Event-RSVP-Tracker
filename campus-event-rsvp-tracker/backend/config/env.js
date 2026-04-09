const path = require("path");
const dotenv = require("dotenv");

const DEFAULT_PORT = 5050;
const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/eventDB";
const DEFAULT_FRONTEND_ORIGINS = "http://localhost:5173";
const REQUIRED_VARS = ["JWT_SECRET"];

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

const getMissingRequiredVars = () => {
  return REQUIRED_VARS.filter((key) => {
    const value = process.env[key];
    return !value || !String(value).trim();
  });
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

  return {
    port: parsePort(process.env.PORT),
    mongoUri: (process.env.MONGODB_URI || DEFAULT_MONGODB_URI).trim() || DEFAULT_MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET.trim(),
    frontendOrigins: parseOrigins(process.env.FRONTEND_ORIGINS)
  };
};

module.exports = {
  getConfig,
  validateEnv
};
