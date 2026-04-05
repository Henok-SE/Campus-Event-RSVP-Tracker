const { getConfig } = require("../config/env");

try {
  const config = getConfig();

  console.log("Environment validation passed.");
  console.log(`PORT=${config.port}`);
  console.log(`MONGODB_URI=${config.mongoUri}`);
  console.log(`FRONTEND_ORIGINS=${config.frontendOrigins.join(",")}`);
} catch (error) {
  console.error(`Environment validation failed: ${error.message}`);
  process.exit(1);
}
