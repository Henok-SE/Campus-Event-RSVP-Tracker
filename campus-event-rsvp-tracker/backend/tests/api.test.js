process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

jest.mock("../models/users", () => {
  const User = jest.fn(function userModel(data) {
    Object.assign(this, data);
  });

  User.findOne = jest.fn();
  User.prototype.save = jest.fn();

  return User;
});

jest.mock("../models/event", () => {
  const Event = jest.fn(function eventModel(data) {
    Object.assign(this, data);
  });

  Event.find = jest.fn();
  Event.findById = jest.fn();
  Event.prototype.save = jest.fn();

  return Event;
});

const User = require("../models/users");
const Event = require("../models/event");
const { app } = require("../server");

describe("Backend API smoke tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  test("POST /api/auth/register returns 201", async () => {
    User.findOne.mockResolvedValue(null);
    const mockSave = jest.fn().mockResolvedValue(undefined);
    User.prototype.save = mockSave;

    const hashSpy = jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password");

    const res = await request(app).post("/api/auth/register").send({
      name: "Jane",
      email: "jane@example.com",
      student_id: "STU-001",
      password: "pass1234"
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
    expect(User.findOne).toHaveBeenCalledWith({ email: "jane@example.com" });
    expect(hashSpy).toHaveBeenCalled();
  });

  test("POST /api/auth/login returns token", async () => {
    User.findOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      name: "Jane",
      email: "jane@example.com",
      student_id: "STU-001",
      role: "Student",
      password: "hashed-password"
    });

    const compareSpy = jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    const res = await request(app).post("/api/auth/login").send({
      email: "jane@example.com",
      password: "pass1234"
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(compareSpy).toHaveBeenCalled();
  });

  test("GET /api/auth/protected requires valid token", async () => {
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);

    const res = await request(app)
      .get("/api/auth/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("You are authorized");
  });

  test("GET /api/events returns events", async () => {
    Event.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { title: "Hackathon" },
        { title: "Music Fest" }
      ])
    });

    const res = await request(app).get("/api/events");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  test("GET /api/events/:id validates object id", async () => {
    const res = await request(app).get("/api/events/not-a-valid-id");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid event id");
  });

  test("GET /api/events/:id returns event", async () => {
    const eventId = new mongoose.Types.ObjectId().toString();
    Event.findById.mockResolvedValue({ _id: eventId, title: "Hackathon" });

    const res = await request(app).get(`/api/events/${eventId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Hackathon");
  });

  test("POST /api/events creates event for authenticated user", async () => {
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
    const mockSave = jest.fn().mockResolvedValue(undefined);
    Event.prototype.save = mockSave;

    const res = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Hackathon", location: "Engineering Hall" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Event created");
    expect(mockSave).toHaveBeenCalled();
  });
});
