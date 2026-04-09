const express = require("express");
const router = express.Router();

const { register, login, me, updateMe } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validateRequired } = require("../middlewares/validateRequest");

router.post("/register", validateRequired(["name", "email", "student_id", "password"]), register);
router.post("/login", validateRequired(["student_id", "password"]), login);
router.get("/me", authMiddleware, me);
router.patch("/me", authMiddleware, updateMe);

router.get("/protected", authMiddleware, (req, res) => {
  res.json({ success: true, message: "You are authorized", data: null });
});

module.exports = router;