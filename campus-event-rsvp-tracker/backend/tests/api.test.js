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
  User.findById = jest.fn();
  User.prototype.save = jest.fn();

  return User;
});

jest.mock("../models/student", () => {
  const Student = jest.fn(function studentModel(data) {
    Object.assign(this, data);
  });

  Student.findOne = jest.fn();

  return Student;
});

jest.mock("../models/event", () => {
  const Event = jest.fn(function eventModel(data) {
    Object.assign(this, data);
  });

  Event.find = jest.fn();
  Event.findById = jest.fn();
  Event.findOneAndUpdate = jest.fn();
  Event.updateOne = jest.fn();
  Event.deleteOne = jest.fn();
  Event.prototype.save = jest.fn();

  return Event;
});

jest.mock("../models/rsvp", () => {
  const RSVP = jest.fn(function rsvpModel(data) {
    Object.assign(this, data);
  });

  RSVP.find = jest.fn();
  RSVP.findOne = jest.fn();
  RSVP.countDocuments = jest.fn();
  RSVP.findOneAndDelete = jest.fn();
  RSVP.deleteMany = jest.fn();
  RSVP.prototype.save = jest.fn();

  return RSVP;
});

jest.mock("../models/authAudit", () => ({
  create: jest.fn().mockResolvedValue(undefined)
}));

const User = require("../models/users");
const Student = require("../models/student");
const Event = require("../models/event");
const RSVP = require("../models/rsvp");
const AuthAudit = require("../models/authAudit");
const { app } = require("../server");

describe("Backend API smoke tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(jest.restoreAllMocks);
  test("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });

  test("POST /api/auth/register returns 201", async () => {
    Student.findOne.mockResolvedValue({
      student_id: "1234/18",
      name: "Jane",
      email: "jane@example.com"
    });
    User.findOne.mockResolvedValue(null);
    const mockSave = jest.fn().mockResolvedValue(undefined);
    User.prototype.save = mockSave;

    const hashSpy = jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password");

    const res = await request(app).post("/api/auth/register").send({
      name: "Jane",
      email: "jane@example.com",
      student_id: "1234/18",
      password: "pass1234"
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
    expect(Student.findOne).toHaveBeenCalledWith({ student_id: "1234/18" });
    expect(hashSpy).toHaveBeenCalled();
    expect(AuthAudit.create).toHaveBeenCalledWith({
      action: "REGISTER",
      student_id: "1234/18",
      success: true,
      reason: "REGISTER_SUCCESS"
    });
  });

  test("POST /api/auth/register ignores submitted name/email mismatches", async () => {
    Student.findOne.mockResolvedValue({
      student_id: "1234/18",
      name: "Official Name",
      email: "official@campus.edu"
    });
    User.findOne.mockResolvedValue(null);
    User.prototype.save = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed-password");

    const res = await request(app).post("/api/auth/register").send({
      name: "Different Name",
      email: "different@campus.edu",
      student_id: "1234/18",
      password: "pass1234"
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(AuthAudit.create).toHaveBeenCalledWith({
      action: "REGISTER",
      student_id: "1234/18",
      success: true,
      reason: "REGISTER_SUCCESS"
    });
  });

  test("POST /api/auth/register rejects invalid student id format", async () => {
    const res = await request(app).post("/api/auth/register").send({
      student_id: "STU-001",
      password: "pass1234"
    });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("student_id format is invalid. Use 1234/18 format");
    expect(AuthAudit.create).toHaveBeenCalledWith({
      action: "REGISTER",
      student_id: "STU-001",
      success: false,
      reason: "INVALID_STUDENT_ID_FORMAT"
    });
  });

  test("POST /api/auth/register rejects unknown student id", async () => {
    Student.findOne.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/register").send({
      student_id: "9999/99",
      password: "pass1234"
    });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe("student_id is not authorized for registration");
    expect(AuthAudit.create).toHaveBeenCalledWith({
      action: "REGISTER",
      student_id: "9999/99",
      success: false,
      reason: "STUDENT_NOT_IN_ROSTER"
    });
  });

  test("POST /api/auth/login returns token", async () => {
    User.findOne.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      name: "Jane",
      email: "jane@example.com",
      student_id: "1234/18",
      role: "Student",
      password: "hashed-password"
    });

    const compareSpy = jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    const res = await request(app).post("/api/auth/login").send({
      student_id: "1234/18",
      password: "pass1234"
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(compareSpy).toHaveBeenCalled();
    expect(AuthAudit.create).toHaveBeenCalledWith({
      action: "LOGIN",
      student_id: "1234/18",
      success: true,
      reason: "LOGIN_SUCCESS"
    });
  });

  test("GET /api/auth/me returns current user", async () => {
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011", role: "Student" }, process.env.JWT_SECRET);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "507f1f77bcf86cd799439011",
        name: "Jane",
        email: "jane@example.com",
        student_id: "1234/18",
        role: "Student"
      })
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student_id).toBe("1234/18");
  });

  test("GET /api/auth/protected requires valid token", async () => {
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);

    const res = await request(app)
      .get("/api/auth/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("You are authorized");
    expect(res.body.success).toBe(true);
  });

  test("GET /api/events returns events", async () => {
    RSVP.countDocuments.mockResolvedValue(5);
    Event.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        {
          title: "Hackathon",
          toObject: () => ({ title: "Hackathon" })
        },
        {
          title: "Music Fest",
          toObject: () => ({ title: "Music Fest" })
        }
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
    expect(res.body.error.message).toBe("Invalid id");
  });

  test("GET /api/events/:id returns event", async () => {
    const eventId = new mongoose.Types.ObjectId().toString();
    RSVP.countDocuments.mockResolvedValue(5);
    Event.findById.mockResolvedValue({
      _id: eventId,
      title: "Hackathon",
      toObject: () => ({ _id: eventId, title: "Hackathon" })
    });

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

  test("PATCH /api/events/:id updates own event", async () => {
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
    const eventId = new mongoose.Types.ObjectId().toString();
    const mockSave = jest.fn().mockResolvedValue(undefined);

    Event.findById.mockResolvedValue({
      _id: eventId,
      created_by: "507f1f77bcf86cd799439011",
      title: "Old title",
      save: mockSave
    });

    const res = await request(app)
      .patch(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New title" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Event updated");
    expect(mockSave).toHaveBeenCalled();
  });

  test("DELETE /api/events/:id rejects non-owner", async () => {
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
    const eventId = new mongoose.Types.ObjectId().toString();

    Event.findById.mockResolvedValue({
      _id: eventId,
      created_by: "aaaaaaaaaaaaaaaaaaaaaaaa"
    });

    const res = await request(app)
      .delete(`/api/events/${eventId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test("POST /api/rsvp creates RSVP", async () => {
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
    const eventId = new mongoose.Types.ObjectId().toString();
    const mockSave = jest.fn().mockResolvedValue(undefined);

    RSVP.findOne.mockResolvedValue(null);
    Event.findById.mockResolvedValue({ _id: eventId, capacity: 100, status: "Published" });
    Event.findOneAndUpdate.mockResolvedValue({ _id: eventId, attending_count: 1 });
    RSVP.prototype.save = mockSave;

    const res = await request(app)
      .post("/api/rsvp")
      .set("Authorization", `Bearer ${token}`)
      .send({ event_id: eventId });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("RSVP created");
    expect(mockSave).toHaveBeenCalled();
  });

  test("POST /api/rsvp returns 409 when event is full", async () => {
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
    const eventId = new mongoose.Types.ObjectId().toString();

    RSVP.findOne.mockResolvedValue(null);
    Event.findById.mockResolvedValue({ _id: eventId, capacity: 1, status: "Published" });
    Event.findOneAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/rsvp")
      .set("Authorization", `Bearer ${token}`)
      .send({ event_id: eventId });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe("Event is full");
  });

  test("POST /api/rsvp rejects invalid payload", async () => {
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);

    const res = await request(app)
      .post("/api/rsvp")
      .set("Authorization", `Bearer ${token}`)
      .send({ event_id: "bad-id" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("DELETE /api/rsvp/:eventId cancels RSVP", async () => {
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
    const eventId = new mongoose.Types.ObjectId().toString();

    RSVP.findOneAndDelete.mockResolvedValue({ _id: "rsvp-1" });

    const res = await request(app)
      .delete(`/api/rsvp/${eventId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("RSVP cancelled");
    expect(Event.updateOne).toHaveBeenCalled();
  });

  test("GET /api/rsvp/my returns my RSVPs", async () => {
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
    const eventId = new mongoose.Types.ObjectId().toString();

    RSVP.countDocuments.mockResolvedValue(15);
    RSVP.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          {
            _id: "rsvp-1",
            status: "Confirmed",
            rsvp_date: new Date("2026-03-20T10:00:00.000Z"),
            event_id: {
              _id: eventId,
              title: "Hackathon",
              toObject: () => ({ _id: eventId, title: "Hackathon" })
            }
          }
        ])
      })
    });

    const res = await request(app)
      .get("/api/rsvp/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].event.title).toBe("Hackathon");
  });

  test("GET unknown route returns not found envelope", async () => {
    const res = await request(app).get("/api/unknown-route");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
