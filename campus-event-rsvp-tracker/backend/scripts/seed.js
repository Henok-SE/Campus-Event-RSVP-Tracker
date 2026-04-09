require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/users");
const Student = require("../models/student");
const Event = require("../models/event");
const RSVP = require("../models/rsvp");
const Attendance = require("../models/attendance");
const AuthAudit = require("../models/authAudit");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eventDB";

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB for seeding");

  await Promise.all([
    Student.syncIndexes(),
    User.syncIndexes(),
    Event.syncIndexes(),
    RSVP.syncIndexes(),
    Attendance.syncIndexes(),
    AuthAudit.syncIndexes()
  ]);

  const defaultPassword = await bcrypt.hash("Password123!", 10);

  const usersData = [
    {
      name: "Genene",
      email: "genene@campus.edu",
      student_id: "1001/18",
      role: "Admin"
    },
    {
      name: "Henok",
      email: "henok@campus.edu",
      student_id: "1002/18",
      role: "Admin"
    },
    {
      name: "Maya",
      email: "maya@campus.edu",
      student_id: "1003/18",
      role: "Admin"
    },
    {
        name: "Bedriya",
        email: "bedriya@campus.edu",
        student_id: "1004/18",
        role: "Admin"
    },
    {
        name: "Hana",
        email: "hana@campus.edu",
        student_id: "1005/18",
        role: "Admin"

    },
    {
        name: "John Student",
        email: "john.student@campus.edu",
        student_id: "2001/18",
        role: "Student"
    },
    {
        name: "Sara Student",
        email: "sara.student@campus.edu",
        student_id: "2002/18",
        role: "Student"
    }
  ];

  const usersByEmail = {};

  for (const entry of usersData) {
    const update = {
      $set: {
        name: entry.name,
        student_id: entry.student_id,
        role: entry.role
      }
    };

    if (entry.role === "Admin") {
      update.$set.password = defaultPassword;
    } else {
      update.$setOnInsert = { password: defaultPassword };
    }

    const user = await User.findOneAndUpdate(
      { email: entry.email },
      update,
      {
        returnDocument: "after",
        upsert: true
      }
    );

    usersByEmail[entry.email] = user;

    await Student.findOneAndUpdate(
      { student_id: entry.student_id },
      {
        $set: {
          name: entry.name,
          email: entry.email.toLowerCase(),
          student_id: entry.student_id
        }
      },
      {
        returnDocument: "after",
        upsert: true
      }
    );
  }

  const eventsData = [
    {
      title: "Spring Hackathon 2026",
      description: "Build products in 24 hours and pitch to judges.",
      location: "Engineering Hall",
      event_date: new Date("2026-04-20T09:00:00.000Z"),
      time: "9:00 AM - 6:00 PM",
      capacity: 120,
      category: "Tech",
      tags: ["Tech", "Academic"],
      image_url: "https://picsum.photos/id/180/1400/800",
      status: "Published",
      created_by: usersByEmail["genene@campus.edu"]._id
    },
    {
      title: "Campus Music Fest",
      description: "Live student performances and guest artists.",
      location: "Main Stadium",
      event_date: new Date("2026-04-24T15:00:00.000Z"),
      time: "3:00 PM - 8:00 PM",
      capacity: 500,
      category: "Arts",
      tags: ["Arts", "Social"],
      image_url: "https://picsum.photos/id/433/1400/800",
      status: "Published",
      created_by: usersByEmail["genene@campus.edu"]._id
    },
    {
      title: "AI and Ethics Panel",
      description: "Faculty and industry experts discuss responsible AI systems.",
      location: "Auditorium B",
      event_date: new Date("2026-04-26T13:30:00.000Z"),
      time: "1:30 PM - 4:00 PM",
      capacity: 180,
      category: "Academic",
      tags: ["Academic", "Tech"],
      image_url: "https://picsum.photos/id/119/1400/800",
      status: "Published",
      created_by: usersByEmail["maya@campus.edu"]._id
    },
    {
      title: "Sunset Yoga on the Lawn",
      description: "Guided yoga and breathing session for all experience levels.",
      location: "West Lawn",
      event_date: new Date("2026-04-21T17:30:00.000Z"),
      time: "5:30 PM - 7:00 PM",
      capacity: 60,
      category: "Social",
      tags: ["Social", "Wellness"],
      image_url: "https://picsum.photos/id/62/1400/800",
      status: "Ongoing",
      created_by: usersByEmail["bedriya@campus.edu"]._id
    },
    {
      title: "Resume Review Clinic",
      description: "Bring your CV for one-on-one feedback with mentors.",
      location: "Career Center",
      event_date: new Date("2026-04-28T10:00:00.000Z"),
      time: "10:00 AM - 1:00 PM",
      capacity: 80,
      category: "Academic",
      tags: ["Academic"],
      image_url: "https://picsum.photos/id/20/1400/800",
      status: "Published",
      created_by: usersByEmail["hana@campus.edu"]._id
    },
    {
      title: "Pizza and Philosophy",
      description: "Open student discussion on technology, meaning, and modern life.",
      location: "Library Lounge",
      event_date: new Date("2026-05-02T16:00:00.000Z"),
      time: "4:00 PM - 6:00 PM",
      capacity: 40,
      category: "Social",
      tags: ["Social", "Free Food"],
      image_url: "https://picsum.photos/id/292/1400/800",
      status: "Draft",
      created_by: usersByEmail["henok@campus.edu"]._id
    },
    {
      title: "Intramural Basketball Finals",
      description: "Championship game between top campus teams.",
      location: "Recreation Center",
      event_date: new Date("2026-04-10T18:00:00.000Z"),
      time: "6:00 PM - 8:30 PM",
      capacity: 300,
      category: "Sports",
      tags: ["Sports"],
      image_url: "https://picsum.photos/id/1011/1400/800",
      status: "Completed",
      created_by: usersByEmail["genene@campus.edu"]._id
    },
    {
      title: "Community Volunteer Day",
      description: "Tree planting and neighborhood clean-up initiative.",
      location: "City Park",
      event_date: new Date("2026-05-04T08:00:00.000Z"),
      time: "8:00 AM - 12:00 PM",
      capacity: 150,
      category: "Social",
      tags: ["Social"],
      image_url: "https://picsum.photos/id/237/1400/800",
      status: "Cancelled",
      created_by: usersByEmail["maya@campus.edu"]._id
    },
    {
      title: "Startup Pitch Night",
      description: "Students pitch startup ideas to alumni and angel mentors.",
      location: "Innovation Hub",
      event_date: new Date("2026-05-06T17:00:00.000Z"),
      time: "5:00 PM - 9:00 PM",
      capacity: 200,
      category: "Tech",
      tags: ["Tech", "Academic"],
      image_url: "https://picsum.photos/id/48/1400/800",
      status: "Published",
      created_by: usersByEmail["henok@campus.edu"]._id
    },
    {
      title: "Taco Tuesday Social",
      description: "Tacos, mocktails, and student networking.",
      location: "Dining Hall Patio",
      event_date: new Date("2026-04-22T16:30:00.000Z"),
      time: "4:30 PM - 7:30 PM",
      capacity: 100,
      category: "Free Food",
      tags: ["Free Food", "Social"],
      image_url: "https://picsum.photos/id/1080/1400/800",
      status: "Published",
      created_by: usersByEmail["hana@campus.edu"]._id
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
      qr_code: "QR-2001-18-HACK2026",
      status: "Confirmed"
    },
    {
      user_id: usersByEmail["sara.student@campus.edu"]._id,
      event_id: eventsByTitle["Campus Music Fest"]._id,
      qr_code: "QR-2002-18-MUSIC2026",
      status: "Confirmed"
    },
    {
      user_id: usersByEmail["john.student@campus.edu"]._id,
      event_id: eventsByTitle["AI and Ethics Panel"]._id,
      qr_code: "QR-2001-18-AIETHICS2026",
      status: "Confirmed"
    },
    {
      user_id: usersByEmail["sara.student@campus.edu"]._id,
      event_id: eventsByTitle["Taco Tuesday Social"]._id,
      qr_code: "QR-2002-18-TACOTUES2026",
      status: "Confirmed"
    },
    {
      user_id: usersByEmail["genene@campus.edu"]._id,
      event_id: eventsByTitle["Startup Pitch Night"]._id,
      qr_code: "QR-1001-18-PITCH2026",
      status: "Confirmed"
    },
    {
      user_id: usersByEmail["maya@campus.edu"]._id,
      event_id: eventsByTitle["Resume Review Clinic"]._id,
      qr_code: "QR-1003-18-RESUME2026",
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

  await Attendance.findOneAndUpdate(
    {
      user_id: usersByEmail["sara.student@campus.edu"]._id,
      event_id: eventsByTitle["Campus Music Fest"]._id
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

  const seededEvents = Object.values(eventsByTitle);
  for (const event of seededEvents) {
    const rsvpCountForEvent = await RSVP.countDocuments({ event_id: event._id });
    await Event.updateOne(
      { _id: event._id },
      { $set: { attending_count: rsvpCountForEvent } }
    );
  }

  const [studentCount, userCount, eventCount, rsvpCount, attendanceCount] = await Promise.all([
    Student.countDocuments(),
    User.countDocuments(),
    Event.countDocuments(),
    RSVP.countDocuments(),
    Attendance.countDocuments()
  ]);

  console.log("Seeding complete");
  console.log(`Students: ${studentCount}`);
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
