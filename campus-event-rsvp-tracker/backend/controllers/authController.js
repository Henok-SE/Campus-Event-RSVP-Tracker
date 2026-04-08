

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Student = require("../models/student");
const AuthAudit = require("../models/authAudit");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { getConfig } = require("../config/env");
const { normalizeStudentId, isValidStudentId } = require("../utils/studentId");

const { jwtSecret } = getConfig();

const auditAuthAttempt = async ({ action, studentId, success, reason = null }) => {
  try {
    await AuthAudit.create({
      action,
      student_id: normalizeStudentId(studentId || ""),
      success,
      reason
    });
  } catch (error) {
    console.error(`Auth audit write failed (${action}):`, error.message);
  }
};

exports.register = async (req, res) => {
  try {
    const { student_id, password } = req.body;

    if (!student_id || !password) {
      await auditAuthAttempt({
        action: "REGISTER",
        studentId: student_id,
        success: false,
        reason: "MISSING_REQUIRED_FIELDS"
      });

      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "student_id and password are required"
      });
    }

    const normalizedStudentId = normalizeStudentId(student_id);

    if (!isValidStudentId(normalizedStudentId)) {
      await auditAuthAttempt({
        action: "REGISTER",
        studentId: normalizedStudentId,
        success: false,
        reason: "INVALID_STUDENT_ID_FORMAT"
      });

      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "student_id format is invalid. Use 1234/18 format"
      });
    }

    const rosterStudent = await Student.findOne({ student_id: normalizedStudentId });

    if (!rosterStudent) {
      await auditAuthAttempt({
        action: "REGISTER",
        studentId: normalizedStudentId,
        success: false,
        reason: "STUDENT_NOT_IN_ROSTER"
      });

      return sendError(res, {
        status: 403,
        code: "REGISTRATION_FORBIDDEN",
        message: "student_id is not authorized for registration"
      });
    }

    const userExists = await User.findOne({
      $or: [
        { student_id: normalizedStudentId },
        { email: rosterStudent.email }
      ]
    });

    if (userExists) {
      await auditAuthAttempt({
        action: "REGISTER",
        studentId: normalizedStudentId,
        success: false,
        reason: "USER_ALREADY_EXISTS"
      });

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

    await auditAuthAttempt({
      action: "REGISTER",
      studentId: normalizedStudentId,
      success: true,
      reason: "REGISTER_SUCCESS"
    });

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

      await auditAuthAttempt({
        action: "REGISTER",
        studentId: req.body?.student_id,
        success: false,
        reason: "DUPLICATE_ENTRY"
      });

      return sendError(res, {
        status: 409,
        code: "DUPLICATE_ENTRY",
        message: `A user with this ${field} already exists`,
        details: { field }
      });
    }

    await auditAuthAttempt({
      action: "REGISTER",
      studentId: req.body?.student_id,
      success: false,
      reason: "REGISTER_FAILED"
    });

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
      await auditAuthAttempt({
        action: "LOGIN",
        studentId: student_id,
        success: false,
        reason: "MISSING_REQUIRED_FIELDS"
      });

      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "student_id and password are required"
      });
    }

    const normalizedStudentId = normalizeStudentId(student_id);

    if (!isValidStudentId(normalizedStudentId)) {
      await auditAuthAttempt({
        action: "LOGIN",
        studentId: normalizedStudentId,
        success: false,
        reason: "INVALID_STUDENT_ID_FORMAT"
      });

      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "student_id format is invalid. Use 1234/18 format"
      });
    }

    const user = await User.findOne({ student_id: normalizedStudentId });

    if (!user) {
      await auditAuthAttempt({
        action: "LOGIN",
        studentId: normalizedStudentId,
        success: false,
        reason: "USER_NOT_FOUND"
      });

      return sendError(res, {
        status: 404,
        code: "USER_NOT_FOUND",
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await auditAuthAttempt({
        action: "LOGIN",
        studentId: normalizedStudentId,
        success: false,
        reason: "INVALID_PASSWORD"
      });

      return sendError(res, {
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: "1d" }
    );

    await auditAuthAttempt({
      action: "LOGIN",
      studentId: normalizedStudentId,
      success: true,
      reason: "LOGIN_SUCCESS"
    });

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
    await auditAuthAttempt({
      action: "LOGIN",
      studentId: req.body?.student_id,
      success: false,
      reason: "LOGIN_FAILED"
    });

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

exports.updateMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const { name, email } = req.body || {};
    const updates = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (!trimmedName) {
        return sendError(res, {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "name cannot be empty"
        });
      }

      updates.name = trimmedName;
    }

    if (email !== undefined) {
      const trimmedEmail = String(email).trim().toLowerCase();

      if (!trimmedEmail) {
        return sendError(res, {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "email cannot be empty"
        });
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(trimmedEmail)) {
        return sendError(res, {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "email format is invalid"
        });
      }

      updates.email = trimmedEmail;
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "At least one updatable field is required"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("_id name email student_id role");

    if (!user) {
      return sendError(res, {
        status: 404,
        code: "USER_NOT_FOUND",
        message: "User not found"
      });
    }

    return sendSuccess(res, {
      status: 200,
      message: "Profile updated",
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
      return sendError(res, {
        status: 409,
        code: "DUPLICATE_ENTRY",
        message: "A user with this email already exists",
        details: { field: "email" }
      });
    }

    return sendError(res, {
      status: 500,
      code: "PROFILE_UPDATE_FAILED",
      message: "Failed to update profile"
    });
  }
};