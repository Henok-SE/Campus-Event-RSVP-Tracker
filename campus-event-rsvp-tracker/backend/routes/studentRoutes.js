const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  createStudent,
  getAllStudents,
  getStudentByStudentId,
  getStudentByEmail,
  updateStudent,
  deleteStudent,
  searchStudents
} = require("../controllers/studentController");

// Routes
router.post("/", authMiddleware, createStudent);
router.get("/", authMiddleware, getAllStudents);
router.get("/search", authMiddleware, searchStudents);
router.get("/by-email/:email", authMiddleware, getStudentByEmail);
router.get("/by-student-id/:studentId", authMiddleware, getStudentByStudentId);
router.put("/:id", authMiddleware, updateStudent);
router.delete("/:id", authMiddleware, deleteStudent);

module.exports = router;