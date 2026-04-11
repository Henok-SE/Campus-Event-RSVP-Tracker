const fs = require("fs");
const path = require("path");
const multer = require("multer");

const EVENT_UPLOAD_DIR = path.join(__dirname, "..", "uploads", "events");
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_STORAGE_LOCAL = "local";
const IMAGE_STORAGE_CLOUDINARY = "cloudinary";
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

const getImageStorageMode = () => {
  const rawValue = String(process.env.IMAGE_STORAGE || IMAGE_STORAGE_LOCAL).trim().toLowerCase();
  return rawValue === IMAGE_STORAGE_CLOUDINARY ? IMAGE_STORAGE_CLOUDINARY : IMAGE_STORAGE_LOCAL;
};

const activeImageStorageMode = getImageStorageMode();

if (activeImageStorageMode === IMAGE_STORAGE_LOCAL) {
  fs.mkdirSync(EVENT_UPLOAD_DIR, { recursive: true });
}

const diskStorage = multer.diskStorage({
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

const storage = activeImageStorageMode === IMAGE_STORAGE_CLOUDINARY
  ? multer.memoryStorage()
  : diskStorage;

const uploadEventImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES
  }
});

module.exports = {
  uploadEventImage,
  MAX_IMAGE_SIZE_BYTES,
  IMAGE_STORAGE_LOCAL,
  IMAGE_STORAGE_CLOUDINARY,
  getImageStorageMode
};