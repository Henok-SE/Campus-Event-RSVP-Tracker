process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "integration-secret";
process.env.FRONTEND_ORIGINS = "http://localhost:5173";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const fs = require("fs");
const path = require("path");

const Student = require("../models/student");
const User = require("../models/users");
const Event = require("../models/event");
const RSVP = require("../models/rsvp");
const Notification = require("../models/notification");
const AuthAudit = require("../models/authAudit");
const { app, connectDB } = require("../server");

let mongoServer;

const removeUploadedFile = (filePath = "") => {
  const normalizedPath = String(filePath).replace(/^\/+/, "");

  if (!normalizedPath) {
    return;
  }

  const absolutePath = path.join(__dirname, "..", normalizedPath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

describe("Backend integration tests", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectDB();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
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
      password: "pass1234",
      interest_categories: ["Academic"],
      interest_keywords: ["machine learning"]
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

  test("register uses ID-only roster gate", async () => {
    await Student.create({
      student_id: "3002/18",
      name: "Official Name",
      email: "official@campus.edu"
    });

    const registerRes = await request(app).post("/api/auth/register").send({
      student_id: "3002/18",
      name: "Other Name",
      email: "other@campus.edu",
      password: "pass1234",
      interest_categories: ["Tech"],
      interest_keywords: ["robotics"]
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);

    const savedUser = await User.findOne({ student_id: "3002/18" });
    expect(savedUser).not.toBeNull();
    expect(savedUser.name).toBe("Other Name");
    expect(savedUser.email).toBe("other@campus.edu");
    expect(savedUser.interest_categories).toEqual(["Tech"]);
    expect(savedUser.interest_keywords).toEqual(["robotics"]);
  });

  test("register rejects invalid student_id format", async () => {
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Bad Id",
      email: "bad.id@example.com",
      student_id: "STU-010",
      password: "pass1234",
      interest_categories: ["Academic"]
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

  test("PATCH /api/auth/me updates the authenticated user profile", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const user = await User.create({
      name: "Before Name",
      email: "before@example.com",
      student_id: "3301/18",
      password: hashed,
      role: "Student"
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    const updateRes = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "After Name",
        email: "AFTER@EXAMPLE.COM"
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.name).toBe("After Name");
    expect(updateRes.body.data.email).toBe("after@example.com");

    const updated = await User.findById(user._id);
    expect(updated.name).toBe("After Name");
    expect(updated.email).toBe("after@example.com");
  });

  test("PATCH /api/auth/me returns 409 for duplicate email", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const user1 = await User.create({
      name: "User One",
      email: "one-update@example.com",
      student_id: "3302/18",
      password: hashed,
      role: "Student"
    });

    await User.create({
      name: "User Two",
      email: "taken-update@example.com",
      student_id: "3303/18",
      password: hashed,
      role: "Student"
    });

    const token = jwt.sign({ id: user1._id, role: user1.role }, process.env.JWT_SECRET);

    const updateRes = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "taken-update@example.com" });

    expect(updateRes.status).toBe(409);
    expect(updateRes.body.error.code).toBe("DUPLICATE_ENTRY");
  });

  test("PATCH /api/auth/me validates payload", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const user = await User.create({
      name: "User Three",
      email: "three@example.com",
      student_id: "3304/18",
      password: hashed,
      role: "Student"
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    const updateRes = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "bad-email" });

    expect(updateRes.status).toBe(400);
    expect(updateRes.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("POST /api/events/upload-image uploads image for authenticated user", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const user = await User.create({
      name: "Uploader",
      email: "uploader@example.com",
      student_id: "3305/18",
      password: hashed,
      role: "Student"
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    const uploadRes = await request(app)
      .post("/api/events/upload-image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", Buffer.from("png-binary"), "poster.png");

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.image_url).toContain("/uploads/events/");
    expect(uploadRes.body.data.file_path).toContain("/uploads/events/");

    removeUploadedFile(uploadRes.body.data.file_path);
  });

  test("POST /api/events/upload-image rejects unauthenticated request", async () => {
    const uploadRes = await request(app)
      .post("/api/events/upload-image")
      .attach("image", Buffer.from("png-binary"), "poster.png");

    expect(uploadRes.status).toBe(401);
    expect(uploadRes.body.error.code).toBe("UNAUTHORIZED");
  });

  test("POST /api/events/upload-image rejects unsupported mime types", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const user = await User.create({
      name: "Uploader Two",
      email: "uploader2@example.com",
      student_id: "3306/18",
      password: hashed,
      role: "Student"
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    const uploadRes = await request(app)
      .post("/api/events/upload-image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", Buffer.from("plain-text"), "notes.txt");

    expect(uploadRes.status).toBe(400);
    expect(uploadRes.body.error.code).toBe("UPLOAD_ERROR");
  });

  test("POST /api/events/upload-image enforces size limits", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const user = await User.create({
      name: "Uploader Three",
      email: "uploader3@example.com",
      student_id: "3307/18",
      password: hashed,
      role: "Student"
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    const oversizedFile = Buffer.alloc(5 * 1024 * 1024 + 1, 1);

    const uploadRes = await request(app)
      .post("/api/events/upload-image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", oversizedFile, "big.jpg");

    expect(uploadRes.status).toBe(400);
    expect(uploadRes.body.error.code).toBe("UPLOAD_ERROR");
    expect(uploadRes.body.error.message).toBe("Image size must be 5MB or less");
  });

  test("student-created events are pending and hidden from public listing", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const student = await User.create({
      name: "Student Creator",
      email: "student.creator@example.com",
      student_id: "3310/18",
      password: hashed,
      role: "Student"
    });

    const studentToken = jwt.sign({ id: student._id, role: student.role }, process.env.JWT_SECRET);

    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        title: "Student Pending Event",
        description: "Needs review",
        status: "Published"
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.status).toBe("Pending");

    const createdEventId = createRes.body.data._id;

    const publicListRes = await request(app).get("/api/events");
    expect(publicListRes.status).toBe(200);
    expect(publicListRes.body.data).toHaveLength(0);

    const ownerListRes = await request(app)
      .get("/api/events")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(ownerListRes.status).toBe(200);
    expect(ownerListRes.body.data).toHaveLength(1);
    expect(ownerListRes.body.data[0].status).toBe("Pending");

    const publicDetailRes = await request(app).get(`/api/events/${createdEventId}`);
    expect(publicDetailRes.status).toBe(404);

    const ownerDetailRes = await request(app)
      .get(`/api/events/${createdEventId}`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(ownerDetailRes.status).toBe(200);
    expect(ownerDetailRes.body.data.status).toBe("Pending");
  });

  test("admin can approve pending event and publish to public listings", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const admin = await User.create({
      name: "Admin Reviewer",
      email: "admin.reviewer@example.com",
      student_id: "3311/18",
      password: hashed,
      role: "Admin"
    });

    const student = await User.create({
      name: "Student Submitter",
      email: "student.submitter@example.com",
      student_id: "3312/18",
      password: hashed,
      role: "Student"
    });

    const adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);
    const studentToken = jwt.sign({ id: student._id, role: student.role }, process.env.JWT_SECRET);

    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ title: "Moderation Queue Event" });

    expect(createRes.status).toBe(201);
    const eventId = createRes.body.data._id;

    const pendingQueueRes = await request(app)
      .get("/api/events/review/pending")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(pendingQueueRes.status).toBe(200);
    expect(pendingQueueRes.body.data).toHaveLength(1);

    const approveRes = await request(app)
      .patch(`/api/events/${eventId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "approve" });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe("Published");

    const publicListRes = await request(app).get("/api/events");
    expect(publicListRes.status).toBe(200);
    expect(publicListRes.body.data).toHaveLength(1);
    expect(publicListRes.body.data[0].status).toBe("Published");
  });

  test("publishing an event notifies users with matching interests", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const admin = await User.create({
      name: "Publishing Admin",
      email: "publishing.admin@example.com",
      student_id: "3316/18",
      password: hashed,
      role: "Admin"
    });

    const creator = await User.create({
      name: "Creator Student",
      email: "creator.student@example.com",
      student_id: "3317/18",
      password: hashed,
      role: "Student"
    });

    const categoryMatchUser = await User.create({
      name: "Category Match",
      email: "category.match@example.com",
      student_id: "3318/18",
      password: hashed,
      role: "Student",
      interest_categories: ["Tech"]
    });

    const keywordMatchUser = await User.create({
      name: "Keyword Match",
      email: "keyword.match@example.com",
      student_id: "3319/18",
      password: hashed,
      role: "Student",
      interest_keywords: ["robotics"]
    });

    const nonMatchUser = await User.create({
      name: "Non Match",
      email: "non.match@example.com",
      student_id: "3320/18",
      password: hashed,
      role: "Student",
      interest_categories: ["Arts"],
      interest_keywords: ["photography"]
    });

    const adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);
    const creatorToken = jwt.sign({ id: creator._id, role: creator.role }, process.env.JWT_SECRET);

    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        title: "Campus Robotics Demo",
        category: "Tech",
        tags: ["Tech", "Robotics"]
      });

    expect(createRes.status).toBe(201);
    const eventId = createRes.body.data._id;

    const approveRes = await request(app)
      .patch(`/api/events/${eventId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "approve" });

    expect(approveRes.status).toBe(200);

    const categoryUserNotifications = await Notification.find({ user_id: categoryMatchUser._id, event_id: eventId });
    const keywordUserNotifications = await Notification.find({ user_id: keywordMatchUser._id, event_id: eventId });
    const nonMatchNotifications = await Notification.find({ user_id: nonMatchUser._id, event_id: eventId });
    const creatorInterestNotifications = await Notification.find({
      user_id: creator._id,
      event_id: eventId,
      title: "New event for your interests"
    });

    expect(categoryUserNotifications.some((item) => item.title === "New event for your interests")).toBe(true);
    expect(keywordUserNotifications.some((item) => item.title === "New event for your interests")).toBe(true);
    expect(nonMatchNotifications.length).toBe(0);
    expect(creatorInterestNotifications.length).toBe(0);
  });

  test("reject requires reason and creator can resubmit rejected events", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const admin = await User.create({
      name: "Admin Reviewer Two",
      email: "admin2@example.com",
      student_id: "3313/18",
      password: hashed,
      role: "Admin"
    });

    const student = await User.create({
      name: "Rejected Submitter",
      email: "reject.submitter@example.com",
      student_id: "3314/18",
      password: hashed,
      role: "Student"
    });

    const adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);
    const studentToken = jwt.sign({ id: student._id, role: student.role }, process.env.JWT_SECRET);

    const createRes = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ title: "Needs Changes Event", description: "v1" });

    expect(createRes.status).toBe(201);
    const eventId = createRes.body.data._id;

    const rejectWithoutReasonRes = await request(app)
      .patch(`/api/events/${eventId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "reject" });

    expect(rejectWithoutReasonRes.status).toBe(400);
    expect(rejectWithoutReasonRes.body.error.code).toBe("VALIDATION_ERROR");

    const rejectWithReasonRes = await request(app)
      .patch(`/api/events/${eventId}/review`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ decision: "reject", reason: "Please add detailed location and agenda" });

    expect(rejectWithReasonRes.status).toBe(200);
    expect(rejectWithReasonRes.body.data.status).toBe("Rejected");
    expect(rejectWithReasonRes.body.data.rejection_reason).toBe("Please add detailed location and agenda");

    const publicListRes = await request(app).get("/api/events");
    expect(publicListRes.status).toBe(200);
    expect(publicListRes.body.data).toHaveLength(0);

    const ownerListRes = await request(app)
      .get("/api/events")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(ownerListRes.status).toBe(200);
    expect(ownerListRes.body.data).toHaveLength(1);
    expect(ownerListRes.body.data[0].status).toBe("Rejected");

    const resubmitRes = await request(app)
      .patch(`/api/events/${eventId}/resubmit`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ description: "v2 with full agenda and room details" });

    expect(resubmitRes.status).toBe(200);
    expect(resubmitRes.body.data.status).toBe("Pending");
    expect(resubmitRes.body.data.rejection_reason).toBeNull();
  });

  test("non-admin users cannot access admin moderation queue", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const student = await User.create({
      name: "Non Admin",
      email: "non-admin@example.com",
      student_id: "3315/18",
      password: hashed,
      role: "Student"
    });

    const studentToken = jwt.sign({ id: student._id, role: student.role }, process.env.JWT_SECRET);

    const queueRes = await request(app)
      .get("/api/events/review/pending")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(queueRes.status).toBe(403);
    expect(queueRes.body.error.code).toBe("FORBIDDEN");
  });

  test("notifications API supports CRUD read flows", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const user = await User.create({
      name: "Notify User",
      email: "notify@example.com",
      student_id: "3308/18",
      password: hashed,
      role: "Student"
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    const createRes = await request(app)
      .post("/api/notifications")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "reminder",
        title: "Reminder",
        message: "Your event starts in 1 hour"
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.read).toBe(false);

    const notificationId = createRes.body.data.id;

    const listRes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data).toHaveLength(1);

    const readRes = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set("Authorization", `Bearer ${token}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.data.read).toBe(true);

    await request(app)
      .post("/api/notifications")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Second message" });

    const readAllRes = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${token}`);

    expect(readAllRes.status).toBe(200);
    expect(readAllRes.body.data.updated_count).toBeGreaterThanOrEqual(1);

    const deleteRes = await request(app)
      .delete(`/api/notifications/${notificationId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  test("RSVP create and cancel generate notifications", async () => {
    const hashed = await bcrypt.hash("pass1234", 10);

    const user = await User.create({
      name: "RSVP User",
      email: "rsvp-user@example.com",
      student_id: "3309/18",
      password: hashed,
      role: "Student"
    });

    const event = await Event.create({
      title: "Campus Music Night",
      status: "Published",
      capacity: 20,
      created_by: user._id,
      attending_count: 0
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    const createRsvpRes = await request(app)
      .post("/api/rsvp")
      .set("Authorization", `Bearer ${token}`)
      .send({ event_id: event._id.toString() });

    expect(createRsvpRes.status).toBe(201);

    let notifications = await Notification.find({ user_id: user._id }).sort({ created_at: -1 });
    expect(notifications.length).toBe(1);
    expect(notifications[0].title).toBe("RSVP confirmed");

    const cancelRsvpRes = await request(app)
      .delete(`/api/rsvp/${event._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(cancelRsvpRes.status).toBe(200);

    notifications = await Notification.find({ user_id: user._id }).sort({ created_at: -1 });
    expect(notifications.length).toBe(2);
    expect(notifications[0].title).toBe("RSVP cancelled");
  });
});
