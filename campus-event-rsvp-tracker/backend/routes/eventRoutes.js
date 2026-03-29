
const express = require("express");
const router = express.Router();

const { createEvent, getEvents} = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, createEvent);
router.get("/", getEvents);

module.exports = router;