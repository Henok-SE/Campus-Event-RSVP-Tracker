const express = require("express");
const router = express.Router();

const { createEvent, getEvents, getEventById } = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", getEvents);
router.get("/:id", getEventById);

router.post("/", authMiddleware, createEvent);

module.exports = router;