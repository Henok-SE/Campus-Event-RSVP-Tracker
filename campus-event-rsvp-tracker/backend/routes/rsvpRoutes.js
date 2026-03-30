const express = require("express");

const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { createRsvp, cancelRsvp, getMyRsvps } = require("../controllers/rsvpController");

router.post("/", authMiddleware, createRsvp);
router.delete("/:eventId", authMiddleware, cancelRsvp);
router.get("/my", authMiddleware, getMyRsvps);

module.exports = router;
