const fs = require("fs");
const path = require("path");
const multer = require("multer");

const EVENT_UPLOAD_DIR = path.join(__dirname, "..", "uploads", "events");
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

fs.mkdirSync(EVENT_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, EVENT_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeExtension = extension.replace(/[^.a-z0-9]/g, "") || ".jpg";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new Error("Only JPG, PNG, WEBP, and GIF images are allowed"));
    return;
  }

  cb(null, true);
};

const uploadEventImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES
  }
});

module.exports = {
  uploadEventImage,
  MAX_IMAGE_SIZE_BYTES
};