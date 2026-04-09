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

    const { getConfig } = require("../config/env");
    const config = getConfig();

    expect(config.jwtSecret).toBe("local-secret");
    expect(config.port).toBe(5050);
    expect(config.mongoUri).toBe("mongodb://127.0.0.1:27017/eventDB");
    expect(config.frontendOrigins).toEqual(["http://localhost:5173"]);
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
});
