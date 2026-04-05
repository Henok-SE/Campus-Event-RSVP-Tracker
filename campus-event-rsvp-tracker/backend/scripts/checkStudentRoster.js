require("dotenv").config();

const mongoose = require("mongoose");
const Student = require("../models/student");
const { normalizeStudentId, isValidStudentId } = require("../utils/studentId");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eventDB";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getRecordIssues = (student) => {
  const issues = [];
  const studentId = normalizeStudentId(student.student_id || "");
  const email = String(student.email || "").trim().toLowerCase();
  const name = String(student.name || "").trim();

  if (!studentId) {
    issues.push("MISSING_STUDENT_ID");
  } else if (!isValidStudentId(studentId)) {
    issues.push("INVALID_STUDENT_ID_FORMAT");
  }

  if (!email) {
    issues.push("MISSING_EMAIL");
  } else if (!EMAIL_PATTERN.test(email)) {
    issues.push("INVALID_EMAIL_FORMAT");
  }

  if (!name) {
    issues.push("MISSING_NAME");
  }

  return issues;
};

const checkStudentRoster = async () => {
  await mongoose.connect(MONGO_URI);

  const students = await Student.find({}).lean();
  const invalidRecords = [];

  for (const student of students) {
    const issues = getRecordIssues(student);
    if (issues.length > 0) {
      invalidRecords.push({
        id: student._id,
        student_id: student.student_id,
        issues
      });
    }
  }

  console.log(`Total student records: ${students.length}`);
  console.log(`Invalid student records: ${invalidRecords.length}`);

  if (invalidRecords.length > 0) {
    console.log("Invalid entries (up to first 20):");
    invalidRecords.slice(0, 20).forEach((record, index) => {
      console.log(
        `${index + 1}. id=${record.id} student_id=${record.student_id || "<empty>"} issues=${record.issues.join(",")}`
      );
    });
    process.exitCode = 1;
  }
};

checkStudentRoster()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  })
  .catch(async (error) => {
    console.error("Student roster check failed:", error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  });
