const express = require("express");
const router = express.Router();

const { createEvent } = require("../controllers/eventController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createEvent);

module.exports = router;