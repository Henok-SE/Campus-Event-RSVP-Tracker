process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "integration-secret";
process.env.FRONTEND_ORIGINS = "http://localhost:5173";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const Student = require("../models/student");
const User = require("../models/users");
const Event = require("../models/event");
const RSVP = require("../models/rsvp");
const AuthAudit = require("../models/authAudit");
const { app, connectDB } = require("../server");

let mongoServer;

describe("Backend integration tests", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDB();
  });

  beforeEach(async () => {
    await RSVP.deleteMany({});
    await Event.deleteMany({});
    await User.deleteMany({});
    await Student.deleteMany({});
    await AuthAudit.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  test("register + login + me flow works", async () => {
    await Student.create({
      student_id: "3001/18",
      name: "Jane Doe",
      email: "jane@example.com"
    });

    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Jane Doe",
      email: "jane@example.com",
      student_id: "3001/18",
      password: "pass1234"
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);

    const loginRes = await request(app).post("/api/auth/login").send({
      student_id: "3001/18",
      password: "pass1234"
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const { token } = loginRes.body.data;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.student_id).toBe("3001/18");

    const auditCount = await AuthAudit.countDocuments({ student_id: "3001/18", success: true });
    expect(auditCount).toBe(2);
  });

  test("register rejects invalid student_id format", async () => {
    const registerRes = await request(app).post("/api/auth/register").send({
      student_id: "STU-010",
      password: "pass1234"
    });

    expect(registerRes.status).toBe(400);
    expect(registerRes.body.error.message).toBe("student_id format is invalid. Use 1234/18 format");

    const audit = await AuthAudit.findOne({ action: "REGISTER", student_id: "STU-010" });
    expect(audit).not.toBeNull();
    expect(audit.success).toBe(false);
    expect(audit.reason).toBe("INVALID_STUDENT_ID_FORMAT");
  });

  test("RSVP capacity allows only one user when one seat remains", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const user1 = await User.create({
      name: "User One",
      email: "one@example.com",
      student_id: "3101/18",
      password: hashed,
      role: "Student"
    });

    const user2 = await User.create({
      name: "User Two",
      email: "two@example.com",
      student_id: "3102/18",
      password: hashed,
      role: "Student"
    });

    const event = await Event.create({
      title: "Capacity Test Event",
      status: "Published",
      capacity: 1,
      created_by: user1._id,
      attending_count: 0
    });

    const token1 = jwt.sign({ id: user1._id, role: user1.role }, process.env.JWT_SECRET);
    const token2 = jwt.sign({ id: user2._id, role: user2.role }, process.env.JWT_SECRET);

    const [res1, res2] = await Promise.all([
      request(app)
        .post("/api/rsvp")
        .set("Authorization", `Bearer ${token1}`)
        .send({ event_id: event._id.toString() }),
      request(app)
        .post("/api/rsvp")
        .set("Authorization", `Bearer ${token2}`)
        .send({ event_id: event._id.toString() })
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const rsvpCount = await RSVP.countDocuments({ event_id: event._id });
    expect(rsvpCount).toBe(1);

    const updatedEvent = await Event.findById(event._id);
    expect(updatedEvent.attending_count).toBe(1);
  });

  test("Deleting event removes related RSVPs", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const owner = await User.create({
      name: "Owner",
      email: "owner@example.com",
      student_id: "3201/18",
      password: hashed,
      role: "Student"
    });

    const attendee = await User.create({
      name: "Attendee",
      email: "attendee@example.com",
      student_id: "3202/18",
      password: hashed,
      role: "Student"
    });

    const event = await Event.create({
      title: "Delete Cascade Event",
      status: "Published",
      capacity: 20,
      created_by: owner._id,
      attending_count: 1
    });

    await RSVP.create({
      user_id: attendee._id,
      event_id: event._id,
      status: "Confirmed"
    });

    const ownerToken = jwt.sign({ id: owner._id, role: owner.role }, process.env.JWT_SECRET);

    const deleteRes = await request(app)
      .delete(`/api/events/${event._id}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const remainingEvent = await Event.findById(event._id);
    const remainingRsvps = await RSVP.countDocuments({ event_id: event._id });

    expect(remainingEvent).toBeNull();
    expect(remainingRsvps).toBe(0);
  });
});
