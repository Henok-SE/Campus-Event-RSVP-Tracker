require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/users");
const Event = require("../models/event");
const RSVP = require("../models/rsvp");
const Attendance = require("../models/attendance");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eventDB";

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB for seeding");

  await Promise.all([
    User.syncIndexes(),
    Event.syncIndexes(),
    RSVP.syncIndexes(),
    Attendance.syncIndexes()
  ]);

  const defaultPassword = await bcrypt.hash("Password123!", 10);

  const usersData = [
    {
      name: "Genene",
      email: "genene@campus.edu",
      student_id: "ADM-0001",
      role: "Admin"
    },
    {
      name: "Henok",
      email: "henok@campus.edu",
      student_id: "ADM-0002",
      role: "Admin"
    },
    {
      name: "Maya",
      email: "maya@campus.edu",
      student_id: "ADM-0003",
      role: "Admin"
    },
    {
        name: "Bedriya",
        email: "bedriya@campus.edu",
        student_id: "ADM-0004",
        role: "Admin"
    },
    {
        name: "Hana",
        email: "hana@campus.edu",
        student_id: "ADM-0005",
        role: "Admin"

    },
    {
        name: "John Student",
        email: "john.student@campus.edu",
        student_id: "STU-1001",
        role: "Student"
    },
    {
        name: "Sara Student",
        email: "sara.student@campus.edu",
        student_id: "STU-1002",
        role: "Student"
    }
  ];

  const usersByEmail = {};

  for (const entry of usersData) {
    const user = await User.findOneAndUpdate(
      { email: entry.email },
      {
        $set: {
          name: entry.name,
          student_id: entry.student_id,
          role: entry.role
        },
        $setOnInsert: {
          password: defaultPassword
        }
      },
      {
        returnDocument: "after",
        upsert: true
      }
    );

    usersByEmail[entry.email] = user;
  }

  const eventsData = [
    {
      title: "Spring Hackathon 2026",
      description: "Build products in 24 hours and pitch to judges.",
      location: "Engineering Hall",
      event_date: new Date("2026-04-05T09:00:00.000Z"),
      status: "Published",
      created_by: usersByEmail["admin@campus.edu"]._id
    },
    {
      title: "Campus Music Fest",
      description: "Live student performances and guest artists.",
      location: "Main Stadium",
      event_date: new Date("2026-04-12T15:00:00.000Z"),
      status: "Published",
      created_by: usersByEmail["admin@campus.edu"]._id
    }
  ];

  const eventsByTitle = {};

  for (const entry of eventsData) {
    const event = await Event.findOneAndUpdate(
      { title: entry.title },
      { $set: entry },
      {
        returnDocument: "after",
        upsert: true
      }
    );

    eventsByTitle[entry.title] = event;
  }

  const rsvpData = [
    {
      user_id: usersByEmail["john.student@campus.edu"]._id,
      event_id: eventsByTitle["Spring Hackathon 2026"]._id,
      qr_code: "QR-STU1001-HACK2026",
      status: "Confirmed"
    },
    {
      user_id: usersByEmail["sara.student@campus.edu"]._id,
      event_id: eventsByTitle["Campus Music Fest"]._id,
      qr_code: "QR-STU1002-MUSIC2026",
      status: "Confirmed"
    }
  ];

  for (const entry of rsvpData) {
    await RSVP.findOneAndUpdate(
      { user_id: entry.user_id, event_id: entry.event_id },
      { $set: entry },
      {
        returnDocument: "after",
        upsert: true
      }
    );
  }

  await Attendance.findOneAndUpdate(
    {
      user_id: usersByEmail["john.student@campus.edu"]._id,
      event_id: eventsByTitle["Spring Hackathon 2026"]._id
    },
    {
      $set: {
        validation_method: "QR"
      }
    },
    {
      returnDocument: "after",
      upsert: true
    }
  );

  const [userCount, eventCount, rsvpCount, attendanceCount] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments(),
    RSVP.countDocuments(),
    Attendance.countDocuments()
  ]);

  console.log("Seeding complete");
  console.log(`Users: ${userCount}`);
  console.log(`Events: ${eventCount}`);
  console.log(`RSVPs: ${rsvpCount}`);
  console.log(`Attendances: ${attendanceCount}`);
  console.log("Default accounts use password: Password123!");
};

seed()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  });
