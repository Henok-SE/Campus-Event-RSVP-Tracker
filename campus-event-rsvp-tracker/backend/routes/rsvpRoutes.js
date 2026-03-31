const express = require("express");

const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { createRsvp, cancelRsvp, getMyRsvps } = require("../controllers/rsvpController");
const { validateObjectIdParam, validateRsvpBody } = require("../middlewares/validateRequest");

router.post("/", authMiddleware, validateRsvpBody, createRsvp);
router.delete("/:eventId", authMiddleware, validateObjectIdParam("eventId"), cancelRsvp);
router.get("/my", authMiddleware, getMyRsvps);

module.exports = router;
