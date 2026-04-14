describe("Environment configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: "test" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("throws when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;

    const { validateEnv } = require("../config/env");

    expect(() => validateEnv()).toThrow(/JWT_SECRET/);
  });

  test("throws when JWT_SECRET is whitespace", () => {
    process.env.JWT_SECRET = "    ";

    const { validateEnv } = require("../config/env");

    expect(() => validateEnv()).toThrow(/JWT_SECRET/);
  });

  test("applies defaults and normalizes parsed values", () => {
    process.env.JWT_SECRET = "  local-secret  ";
    delete process.env.PORT;
    delete process.env.MONGODB_URI;
    delete process.env.FRONTEND_ORIGINS;
    delete process.env.IMAGE_STORAGE;

    const { getConfig } = require("../config/env");
    const config = getConfig();

    expect(config.jwtSecret).toBe("local-secret");
    expect(config.port).toBe(5050);
    expect(config.mongoUri).toBe("mongodb://127.0.0.1:27017/eventDB");
    expect(config.frontendOrigins).toEqual(["http://localhost:5173"]);
    expect(config.imageStorage).toBe("local");
  });

  test("parses custom frontend origins and valid port", () => {
    process.env.JWT_SECRET = "abc123";
    process.env.PORT = "8080";
    process.env.MONGODB_URI = "mongodb://localhost:27017/custom";
    process.env.FRONTEND_ORIGINS = "http://localhost:5173, https://campus.edu ,   ";

    const { getConfig } = require("../config/env");
    const config = getConfig();

    expect(config.port).toBe(8080);
    expect(config.mongoUri).toBe("mongodb://localhost:27017/custom");
    expect(config.frontendOrigins).toEqual([
      "http://localhost:5173",
      "https://campus.edu"
    ]);
  });

  test("throws when IMAGE_STORAGE is cloudinary and required credentials are missing", () => {
    process.env.JWT_SECRET = "abc123";
    process.env.IMAGE_STORAGE = "cloudinary";
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const { validateEnv } = require("../config/env");

    expect(() => validateEnv()).toThrow(/CLOUDINARY_CLOUD_NAME/);
    expect(() => validateEnv()).toThrow(/CLOUDINARY_API_KEY/);
    expect(() => validateEnv()).toThrow(/CLOUDINARY_API_SECRET/);
  });

  test("parses cloudinary configuration when enabled", () => {
    process.env.JWT_SECRET = "abc123";
    process.env.IMAGE_STORAGE = "cloudinary";
    process.env.CLOUDINARY_CLOUD_NAME = "demo-cloud";
    process.env.CLOUDINARY_API_KEY = "key-123";
    process.env.CLOUDINARY_API_SECRET = "secret-456";
    process.env.CLOUDINARY_FOLDER = "custom-folder/events";

    const { getConfig } = require("../config/env");
    const config = getConfig();

    expect(config.imageStorage).toBe("cloudinary");
    expect(config.cloudinary).toEqual({
      cloudName: "demo-cloud",
      apiKey: "key-123",
      apiSecret: "secret-456",
      folder: "custom-folder/events"
    });
  });

  test("throws in production when image storage is local", () => {
    process.env.JWT_SECRET = "abc123";
    process.env.NODE_ENV = "production";
    process.env.IMAGE_STORAGE = "local";

    const { validateEnv } = require("../config/env");

    expect(() => validateEnv()).toThrow(/IMAGE_STORAGE=cloudinary/);
  });

  test("allows production when cloudinary is configured", () => {
    process.env.JWT_SECRET = "abc123";
    process.env.NODE_ENV = "production";
    process.env.IMAGE_STORAGE = "cloudinary";
    process.env.CLOUDINARY_CLOUD_NAME = "demo-cloud";
    process.env.CLOUDINARY_API_KEY = "key-123";
    process.env.CLOUDINARY_API_SECRET = "secret-456";

    const { validateEnv } = require("../config/env");

    expect(() => validateEnv()).not.toThrow();
  });
});
