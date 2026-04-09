const express = require("express");
const router = express.Router();

const {
	createEvent,
	uploadEventImage,
	getEvents,
	getPendingReviewEvents,
	reviewEventSubmission,
	resubmitEventForReview,
	getEventById,
	updateEvent,
	deleteEvent
} = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");
const { optionalAuthMiddleware, requireRole } = authMiddleware;
const { uploadEventImage: uploadEventImageMiddleware } = require("../middlewares/uploadMiddleware");
const {
	validateObjectIdParam,
	validateEventBody,
	validateModerationDecision
} = require("../middlewares/validateRequest");

router.get("/", optionalAuthMiddleware, getEvents);
router.get("/review/pending", authMiddleware, requireRole("Admin"), getPendingReviewEvents);
router.get("/:id", optionalAuthMiddleware, validateObjectIdParam("id"), getEventById);

router.post("/upload-image", authMiddleware, uploadEventImageMiddleware.single("image"), uploadEventImage);
router.post("/", authMiddleware, validateEventBody({ partial: false }), createEvent);
router.patch(
	"/:id/review",
	authMiddleware,
	requireRole("Admin"),
	validateObjectIdParam("id"),
	validateModerationDecision,
	reviewEventSubmission
);
router.patch("/:id/resubmit", authMiddleware, validateObjectIdParam("id"), validateEventBody({ partial: true }), resubmitEventForReview);
router.patch("/:id", authMiddleware, validateObjectIdParam("id"), validateEventBody({ partial: true }), updateEvent);
router.delete("/:id", authMiddleware, validateObjectIdParam("id"), deleteEvent);

module.exports = router;