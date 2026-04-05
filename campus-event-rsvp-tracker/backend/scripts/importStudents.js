require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const pdfParse = require("pdf-parse");
const Student = require("../models/student");
const { normalizeStudentId, isValidStudentId } = require("../utils/studentId");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eventDB";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value = "") => value.trim().toLowerCase();
const normalizeName = (value = "") => value.trim().replace(/\s+/g, " ");

const defaultFile = path.resolve(__dirname, "../data/source_docs/students.pdf");

const parseStudentLine = (line) => {
  const trimmed = line.trim();

  if (!trimmed) {
    return null;
  }

  const byIdNameEmail = trimmed.match(/^(\d{4}\s*\/\s*\d{2})\s*[,|\t]\s*(.+?)\s*[,|\t]\s*([^,|\t\s]+@[^,|\t\s]+)$/i);
  if (byIdNameEmail) {
    return {
      student_id: normalizeStudentId(byIdNameEmail[1]),
      name: normalizeName(byIdNameEmail[2]),
      email: normalizeEmail(byIdNameEmail[3])
    };
  }

  const byNameIdEmail = trimmed.match(/^(.+?)\s*[,|\t]\s*(\d{4}\s*\/\s*\d{2})\s*[,|\t]\s*([^,|\t\s]+@[^,|\t\s]+)$/i);
  if (byNameIdEmail) {
    return {
      student_id: normalizeStudentId(byNameIdEmail[2]),
      name: normalizeName(byNameIdEmail[1]),
      email: normalizeEmail(byNameIdEmail[3])
    };
  }

  return null;
};

const extractStudentsFromPdf = async (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const pdf = await pdfParse(fileBuffer);
  const lines = pdf.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = [];

  for (const line of lines) {
    const parsed = parseStudentLine(line);
    if (parsed) {
      rows.push(parsed);
    }
  }

  return rows;
};

const isValidStudent = (student) => {
  if (!student) {
    return false;
  }

  return (
    isValidStudentId(student.student_id) &&
    EMAIL_PATTERN.test(student.email) &&
    Boolean(student.name)
  );
};

const importStudents = async () => {
  const inputArg = process.argv[2];
  const sourcePath = path.resolve(process.cwd(), inputArg || defaultFile);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found at ${sourcePath}`);
  }

  if (path.extname(sourcePath).toLowerCase() !== ".pdf") {
    throw new Error("Only PDF files are supported. Provide a .pdf roster file.");
  }

  await mongoose.connect(MONGO_URI);
  await Student.syncIndexes();

  const rows = await extractStudentsFromPdf(sourcePath);

  const summary = {
    totalRows: rows.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    invalid: 0
  };

  for (const row of rows) {
    if (!isValidStudent(row)) {
      summary.invalid += 1;
      continue;
    }

    const existing = await Student.findOne({ student_id: row.student_id });

    if (!existing) {
      await Student.create(row);
      summary.inserted += 1;
      continue;
    }

    const hasChanged = existing.name !== row.name || existing.email !== row.email;

    if (!hasChanged) {
      summary.skipped += 1;
      continue;
    }

    existing.name = row.name;
    existing.email = row.email;
    await existing.save();
    summary.updated += 1;
  }

  console.log("Student import complete");
  console.log(`Source: ${sourcePath}`);
  console.log(`Rows parsed: ${summary.totalRows}`);
  console.log(`Inserted: ${summary.inserted}`);
  console.log(`Updated: ${summary.updated}`);
  console.log(`Skipped (unchanged): ${summary.skipped}`);
  console.log(`Invalid rows: ${summary.invalid}`);
};

importStudents()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Student import failed:", error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  });
