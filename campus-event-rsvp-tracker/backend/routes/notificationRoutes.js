const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  listNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} = require("../controllers/notificationController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", listNotifications);
router.post("/", createNotification);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.delete("/:id", deleteNotification);

module.exports = router;