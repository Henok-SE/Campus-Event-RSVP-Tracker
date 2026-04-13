require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/users");
const { normalizeStudentId, isValidStudentId } = require("../utils/studentId");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eventDB";

const getArgValue = (args, flag) => {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) {
    return "";
  }

  return String(args[index + 1] || "").trim();
};

const printUsage = () => {
  console.log("Usage:");
  console.log("  npm --prefix backend run user:promote-admin -- --student-id 1234/18 --yes");
  console.log("  npm --prefix backend run user:promote-admin -- --email user@campus.edu --yes");
  console.log("");
  console.log("Notes:");
  console.log("  - Provide either --student-id or --email");
  console.log("  - Use --yes to confirm role change");
};

const promoteAdmin = async () => {
  const args = process.argv.slice(2);
  const rawStudentId = getArgValue(args, "--student-id");
  const rawEmail = getArgValue(args, "--email");
  const confirmed = args.includes("--yes");

  if (!confirmed) {
    console.error("Missing confirmation. Add --yes to apply role change.");
    printUsage();
    process.exit(1);
  }

  const studentId = normalizeStudentId(rawStudentId);
  const email = String(rawEmail || "").trim().toLowerCase();

  if (!studentId && !email) {
    console.error("Missing identifier. Provide --student-id or --email.");
    printUsage();
    process.exit(1);
  }

  if (studentId && !isValidStudentId(studentId)) {
    console.error("Invalid student_id format. Use 1234/18 format.");
    process.exit(1);
  }

  const query = studentId
    ? { student_id: studentId }
    : { email };

  await mongoose.connect(MONGO_URI);

  try {
    const user = await User.findOne(query).select("_id name email student_id role");

    if (!user) {
      console.error("User not found. Ensure the account exists before promotion.");
      process.exit(1);
    }

    if (String(user.role) === "Admin") {
      console.log("User is already an Admin.");
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Student ID: ${user.student_id}`);
      return;
    }

    user.role = "Admin";
    await user.save();

    console.log("User promoted to Admin successfully.");
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Student ID: ${user.student_id}`);
    console.log(`Role: ${user.role}`);
  } finally {
    await mongoose.connection.close();
  }
};

promoteAdmin().catch(async (error) => {
  console.error(`Admin promotion failed: ${error.message}`);

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  } catch {
    // Ignore close errors on failure path.
  }

  process.exit(1);
});
