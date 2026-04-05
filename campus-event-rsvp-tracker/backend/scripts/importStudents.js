require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const pdfParse = require("pdf-parse");
const Student = require("../models/student");
const { normalizeStudentId, isValidStudentId } = require("../utils/studentId");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eventDB";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_IN_TEXT_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const STUDENT_ID_IN_TEXT_PATTERN = /\d{4}\s*\/\s*\d{2}/;
const HEADER_PATTERN = /^name\s*email\s*address\s*id\s*number$/i;

const normalizeEmail = (value = "") => value.trim().toLowerCase();
const normalizeName = (value = "") => value.trim().replace(/\s+/g, " ");
const DEFAULT_FILE_CANDIDATES = [
  path.resolve(__dirname, "../data/Finalized Members 1 - Sheet1.pdf"),
  path.resolve(__dirname, "../data/source_docs/students.pdf")
];

const getDefaultFile = () => {
  const existing = DEFAULT_FILE_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  return existing || DEFAULT_FILE_CANDIDATES[0];
};

const resolveSourcePath = (inputPath) => {
  if (!inputPath) {
    return getDefaultFile();
  }

  const candidates = [
    path.resolve(process.cwd(), inputPath),
    path.resolve(process.cwd(), "..", inputPath)
  ];

  if (path.isAbsolute(inputPath)) {
    candidates.unshift(inputPath);
  }

  if (/^backend[\\/]/.test(inputPath)) {
    const withoutBackendPrefix = inputPath.replace(/^backend[\\/]/, "");
    candidates.push(path.resolve(process.cwd(), withoutBackendPrefix));
  }

  const seen = new Set();
  const uniqueCandidates = candidates.filter((candidate) => {
    if (seen.has(candidate)) {
      return false;
    }
    seen.add(candidate);
    return true;
  });

  const existing = uniqueCandidates.find((candidate) => fs.existsSync(candidate));
  return existing || uniqueCandidates[0];
};

const parseCliArgs = (argv = []) => {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
  const nonFlags = argv.filter((arg) => !arg.startsWith("--"));

  return {
    replaceMode: flags.has("--replace"),
    dryRunMode: flags.has("--dry-run"),
    inputPath: nonFlags[0]
  };
};

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

const parseStudentRecord = (text) => {
  const compact = String(text || "").replace(/\s+/g, " ").trim();

  if (!compact || HEADER_PATTERN.test(compact)) {
    return null;
  }

  const fromDelimited = parseStudentLine(compact);
  if (fromDelimited) {
    return fromDelimited;
  }

  const emailMatch = compact.match(EMAIL_IN_TEXT_PATTERN);
  const idMatches = compact.match(/\d{4}\s*\/\s*\d{2}/g);

  if (!emailMatch || !idMatches || idMatches.length === 0) {
    return null;
  }

  const email = normalizeEmail(emailMatch[0]);
  const studentId = normalizeStudentId(idMatches[idMatches.length - 1]);

  let name = compact.slice(0, emailMatch.index).trim();
  const emailLocalPart = email.split("@")[0];

  if (name.toLowerCase().endsWith(emailLocalPart.toLowerCase())) {
    name = name.slice(0, name.length - emailLocalPart.length).trim();
  }

  name = normalizeName(name);

  if (!name) {
    return null;
  }

  return {
    student_id: studentId,
    name,
    email
  };
};

const extractStudentsFromPdf = async (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const pdf = await pdfParse(fileBuffer);
  const lines = pdf.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = [];
  let unparsed = 0;
  let buffer = "";

  for (const line of lines) {
    if (HEADER_PATTERN.test(line.replace(/\s+/g, ""))) {
      continue;
    }

    buffer = buffer ? `${buffer} ${line}` : line;

    if (!STUDENT_ID_IN_TEXT_PATTERN.test(buffer)) {
      continue;
    }

    const parsed = parseStudentRecord(buffer);
    if (parsed) {
      rows.push(parsed);
    } else {
      unparsed += 1;
    }

    buffer = "";
  }

  if (buffer.trim()) {
    const parsed = parseStudentRecord(buffer);
    if (parsed) {
      rows.push(parsed);
    } else {
      unparsed += 1;
    }
  }

  return {
    rows,
    totalLines: lines.length,
    unparsed
  };
};

const getRowIssues = (student) => {
  const issues = [];

  if (!student) {
    issues.push("EMPTY_ROW");
    return issues;
  }

  if (!isValidStudentId(student.student_id)) {
    issues.push("INVALID_STUDENT_ID_FORMAT");
  }

  if (!EMAIL_PATTERN.test(student.email)) {
    issues.push("INVALID_EMAIL_FORMAT");
  }

  if (!student.name) {
    issues.push("MISSING_NAME");
  }

  return issues;
};

const incrementIssueCounts = (counts, issues) => {
  for (const issue of issues) {
    counts[issue] = (counts[issue] || 0) + 1;
  }
};

const importStudents = async ({ inputPath, replaceMode = false, dryRunMode = false } = {}) => {
  const sourcePath = resolveSourcePath(inputPath);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found at ${sourcePath}`);
  }

  if (path.extname(sourcePath).toLowerCase() !== ".pdf") {
    throw new Error("Only PDF files are supported. Provide a .pdf roster file.");
  }

  await mongoose.connect(MONGO_URI);
  await Student.syncIndexes();

  const extracted = await extractStudentsFromPdf(sourcePath);
  const rows = extracted.rows;

  const summary = {
    mode: replaceMode ? "replace" : "upsert",
    dryRun: dryRunMode,
    totalLines: extracted.totalLines,
    parsedRows: rows.length,
    unparsedRows: extracted.unparsed,
    uniqueValidRows: 0,
    sourceDuplicates: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
    invalid: 0,
    invalidReasons: {}
  };

  const validRowsById = new Map();

  for (const row of rows) {
    const issues = getRowIssues(row);

    if (issues.length > 0) {
      summary.invalid += 1;
      incrementIssueCounts(summary.invalidReasons, issues);
      continue;
    }

    if (validRowsById.has(row.student_id)) {
      summary.sourceDuplicates += 1;
    }

    validRowsById.set(row.student_id, row);
  }

  const validRows = Array.from(validRowsById.values());
  summary.uniqueValidRows = validRows.length;

  for (const row of validRows) {
    const existing = await Student.findOne({ student_id: row.student_id }).lean();

    if (!existing) {
      if (!dryRunMode) {
        await Student.create(row);
      }

      summary.inserted += 1;
      continue;
    }

    const hasChanged = existing.name !== row.name || existing.email !== row.email;

    if (!hasChanged) {
      summary.skipped += 1;
      continue;
    }

    if (!dryRunMode) {
      await Student.updateOne(
        { student_id: row.student_id },
        {
          $set: {
            name: row.name,
            email: row.email
          }
        }
      );
    }

    summary.updated += 1;
  }

  if (replaceMode) {
    if (validRows.length === 0) {
      throw new Error("Replace mode aborted: 0 valid student rows parsed. Refusing to delete all Student records.");
    }

    const rosterIds = validRows.map((row) => row.student_id);
    const deleteFilter = { student_id: { $nin: rosterIds } };

    if (dryRunMode) {
      summary.deleted = await Student.countDocuments(deleteFilter);
    } else {
      const deleteResult = await Student.deleteMany(deleteFilter);
      summary.deleted = deleteResult.deletedCount;
    }
  }

  console.log("Student import complete");
  console.log(`Source: ${sourcePath}`);
  console.log(`Mode: ${summary.mode}${summary.dryRun ? " (dry-run)" : ""}`);
  console.log(`Lines scanned: ${summary.totalLines}`);
  console.log(`Rows parsed: ${summary.parsedRows}`);
  console.log(`Rows unparsed: ${summary.unparsedRows}`);
  console.log(`Unique valid rows: ${summary.uniqueValidRows}`);
  console.log(`Duplicate IDs in source: ${summary.sourceDuplicates}`);
  console.log(`Inserted: ${summary.inserted}`);
  console.log(`Updated: ${summary.updated}`);
  console.log(`Skipped (unchanged): ${summary.skipped}`);
  console.log(`Deleted (replace mode): ${summary.deleted}`);
  console.log(`Invalid rows: ${summary.invalid}`);

  if (Object.keys(summary.invalidReasons).length > 0) {
    console.log("Invalid reason counts:");
    Object.entries(summary.invalidReasons).forEach(([reason, count]) => {
      console.log(`- ${reason}: ${count}`);
    });
  }

  return summary;
};

if (require.main === module) {
  const args = parseCliArgs(process.argv.slice(2));

  importStudents({
    inputPath: args.inputPath,
    replaceMode: args.replaceMode,
    dryRunMode: args.dryRunMode
  })
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
}

module.exports = {
  parseCliArgs,
  resolveSourcePath,
  parseStudentLine,
  parseStudentRecord,
  extractStudentsFromPdf,
  importStudents
};
