

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Student = require("../models/student");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const STUDENT_ID_PATTERN = /^(STU|ADM)-\d+$/i;

const normalizeStudentId = (value = "") => value.trim().toUpperCase();
const normalizeEmail = (value = "") => value.trim().toLowerCase();

exports.register = async (req, res) => {
  try {
    const { name, email, student_id, password } = req.body;

    if (!student_id || !password) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "student_id and password are required"
      });
    }

    const normalizedStudentId = normalizeStudentId(student_id);

    if (!STUDENT_ID_PATTERN.test(normalizedStudentId)) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "student_id format is invalid"
      });
    }

    const rosterStudent = await Student.findOne({ student_id: normalizedStudentId });

    if (!rosterStudent) {
      return sendError(res, {
        status: 403,
        code: "REGISTRATION_FORBIDDEN",
        message: "student_id is not authorized for registration"
      });
    }

    if (email && normalizeEmail(email) !== rosterStudent.email) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "email does not match student roster"
      });
    }

    if (name && name.trim() !== rosterStudent.name) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "name does not match student roster"
      });
    }

    const userExists = await User.findOne({
      $or: [
        { student_id: normalizedStudentId },
        { email: rosterStudent.email }
      ]
    });

    if (userExists) {
      return sendError(res, {
        status: 409,
        code: "DUPLICATE_ENTRY",
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: rosterStudent.name,
      email: rosterStudent.email,
      student_id: normalizedStudentId,
      password: hashedPassword
    });

    await user.save();

    return sendSuccess(res, {
      status: 201,
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

      return sendError(res, {
        status: 409,
        code: "DUPLICATE_ENTRY",
        message: `A user with this ${field} already exists`,
        details: { field }
      });
    }
    return sendError(res, {
      status: 500,
      code: "REGISTER_FAILED",
      message: "Failed to register user"
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { student_id, password } = req.body;

    if (!student_id || !password) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "student_id and password are required"
      });
    }

    const normalizedStudentId = normalizeStudentId(student_id);

    if (!STUDENT_ID_PATTERN.test(normalizedStudentId)) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "student_id format is invalid"
      });
    }

    const user = await User.findOne({ student_id: normalizedStudentId });

    if (!user) {
      return sendError(res, {
        status: 404,
        code: "USER_NOT_FOUND",
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, {
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid password"
      });
    }

    if (!process.env.JWT_SECRET) {
      return sendError(res, {
        status: 500,
        code: "CONFIGURATION_ERROR",
        message: "JWT_SECRET is not configured"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return sendSuccess(res, {
      status: 200,
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
    return sendError(res, {
      status: 500,
      code: "LOGIN_FAILED",
      message: "Failed to login"
    });
  }
};

exports.me = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const user = await User.findById(req.user.id).select("_id name email student_id role");

    if (!user) {
      return sendError(res, {
        status: 404,
        code: "USER_NOT_FOUND",
        message: "User not found"
      });
    }

    return sendSuccess(res, {
      status: 200,
      message: "Current user fetched",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        role: user.role
      }
    });
  } catch (error) {
    return sendError(res, {
      status: 500,
      code: "CURRENT_USER_FETCH_FAILED",
      message: "Failed to fetch current user"
    });
  }
};