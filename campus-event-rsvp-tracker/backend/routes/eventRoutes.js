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
const { validateObjectIdParam, validateEventBody } = require("../middlewares/validateRequest");

router.get("/", getEvents);
router.get("/:id", validateObjectIdParam("id"), getEventById);

router.post("/", authMiddleware, validateEventBody({ partial: false }), createEvent);
router.patch("/:id", authMiddleware, validateObjectIdParam("id"), validateEventBody({ partial: true }), updateEvent);
router.delete("/:id", authMiddleware, validateObjectIdParam("id"), deleteEvent);

module.exports = router;