

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Student = require("../models/student");

const STUDENT_ID_PATTERN = /^(STU|ADM)-\d+$/i;

const normalizeStudentId = (value = "") => value.trim().toUpperCase();
const normalizeEmail = (value = "") => value.trim().toLowerCase();

exports.register = async (req, res) => {
  try {
    const { name, email, student_id, password } = req.body;

    if (!student_id || !password) {
      return res.status(400).json({ message: "student_id and password are required" });
    }

    const normalizedStudentId = normalizeStudentId(student_id);

    if (!STUDENT_ID_PATTERN.test(normalizedStudentId)) {
      return res.status(400).json({ message: "student_id format is invalid" });
    }

    const rosterStudent = await Student.findOne({ student_id: normalizedStudentId });

    if (!rosterStudent) {
      return res.status(403).json({ message: "student_id is not authorized for registration" });
    }

    if (email && normalizeEmail(email) !== rosterStudent.email) {
      return res.status(400).json({ message: "email does not match student roster" });
    }

    if (name && name.trim() !== rosterStudent.name) {
      return res.status(400).json({ message: "name does not match student roster" });
    }

    const userExists = await User.findOne({
      $or: [
        { student_id: normalizedStudentId },
        { email: rosterStudent.email }
      ]
    });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: rosterStudent.name,
      email: rosterStudent.email,
      student_id: normalizedStudentId,
      password: hashedPassword
    });

    await user.save();

    return res.status(201).json({
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        role: user.role
      }
    });

  } catch (error) {
    if (error && error.code === 11000) {
      const fieldFromPattern = error.keyPattern ? Object.keys(error.keyPattern)[0] : undefined;
      const fieldFromValue = !fieldFromPattern && error.keyValue ? Object.keys(error.keyValue)[0] : undefined;
      const field = fieldFromPattern || fieldFromValue || "field";

      return res.status(409).json({
        message: `A user with this ${field} already exists`,
        field
      });
    }
    return res.status(500).json({ message: "Failed to register user" });
  }
};

exports.login = async (req, res) => {
  try {
    const { student_id, password } = req.body;

    if (!student_id || !password) {
      return res.status(400).json({ message: "student_id and password are required" });
    }

    const normalizedStudentId = normalizeStudentId(student_id);

    if (!STUDENT_ID_PATTERN.test(normalizedStudentId)) {
      return res.status(400).json({ message: "student_id format is invalid" });
    }

    const user = await User.findOne({ student_id: normalizedStudentId });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          student_id: user.student_id,
          role: user.role
        }
      }
    });

  } catch (error) {
    return res.status(500).json({ message: "Failed to login" });
  }
};