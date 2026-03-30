const express = require("express");
const router = express.Router();

const {
	createEvent,
	getEvents,
	getEventById,
	updateEvent,
	deleteEvent
} = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", getEvents);
router.get("/:id", getEventById);

router.post("/", authMiddleware, createEvent);
router.patch("/:id", authMiddleware, updateEvent);
router.delete("/:id", authMiddleware, deleteEvent);

module.exports = router;