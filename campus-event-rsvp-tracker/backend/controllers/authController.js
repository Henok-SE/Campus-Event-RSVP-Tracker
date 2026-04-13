

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Student = require("../models/student");
const AuthAudit = require("../models/authAudit");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { getConfig } = require("../config/env");
const { normalizeStudentId, isValidStudentId } = require("../utils/studentId");
const { FIXED_INTEREST_CATEGORY_LOOKUP } = require("../config/interestOptions");

const { jwtSecret } = getConfig();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeName = (value = "") => String(value).trim().replace(/\s+/g, " ");
const normalizeEmail = (value = "") => String(value).trim().toLowerCase();

const normalizeFixedInterests = (value, { required = false } = {}) => {
  if (value === undefined || value === null) {
    return required
      ? { error: "interest_categories is required" }
      : { values: [] };
  }

  if (!Array.isArray(value)) {
    return { error: "interest_categories must be an array" };
  }

  const normalizedValues = [];
  const invalidValues = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      invalidValues.push(String(entry));
      continue;
    }

    const token = entry.trim().toLowerCase();
    if (!token) {
      continue;
    }

    const canonicalCategory = FIXED_INTEREST_CATEGORY_LOOKUP.get(token);
    if (!canonicalCategory) {
      invalidValues.push(entry);
      continue;
    }

    normalizedValues.push(canonicalCategory);
  }

  if (invalidValues.length > 0) {
    return {
      error: "interest_categories contains unsupported values",
      invalidValues
    };
  }

  return { values: [...new Set(normalizedValues)] };
};

const normalizeCustomInterests = (value) => {
  if (value === undefined || value === null) {
    return { values: [] };
  }

  if (!Array.isArray(value)) {
    return { error: "interest_keywords must be an array" };
  }

  const normalizedValues = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      return { error: "interest_keywords must contain strings only" };
    }

    const normalizedKeyword = entry.trim().replace(/\s+/g, " ").toLowerCase();
    if (!normalizedKeyword) {
      continue;
    }

    normalizedValues.push(normalizedKeyword);
  }

  return { values: [...new Set(normalizedValues)] };
};

const normalizeInterestPayload = ({
  interest_categories,
  interest_keywords,
  requireAtLeastOne = false,
  requireFixedCategories = false
}) => {
  const fixedInterestsResult = normalizeFixedInterests(interest_categories, {
    required: requireFixedCategories
  });
  if (fixedInterestsResult.error) {
    return {
      error: {
        status: 400,
        message: fixedInterestsResult.error,
        details: fixedInterestsResult.invalidValues ? { invalidValues: fixedInterestsResult.invalidValues } : undefined
      }
    };
  }

  const customInterestsResult = normalizeCustomInterests(interest_keywords);
  if (customInterestsResult.error) {
    return {
      error: {
        status: 400,
        message: customInterestsResult.error
      }
    };
  }

  const normalizedCategories = fixedInterestsResult.values;
  const normalizedKeywords = customInterestsResult.values;

  if (requireAtLeastOne && normalizedCategories.length + normalizedKeywords.length === 0) {
    return {
      error: {
        status: 400,
        message: "At least one interest is required"
      }
    };
  }

  return {
    data: {
      interest_categories: normalizedCategories,
      interest_keywords: normalizedKeywords
    }
  };
};

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
    const { student_id, password, name, email, interest_categories, interest_keywords } = req.body;

    if (!student_id || !password || !name || !email) {
      await auditAuthAttempt({
        action: "REGISTER",
        studentId: student_id,
        success: false,
        reason: "MISSING_REQUIRED_FIELDS"
      });

      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "name, email, student_id, and password are required"
      });
    }

    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedName) {
      await auditAuthAttempt({
        action: "REGISTER",
        studentId: student_id,
        success: false,
        reason: "INVALID_NAME"
      });

      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "name cannot be empty"
      });
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      await auditAuthAttempt({
        action: "REGISTER",
        studentId: student_id,
        success: false,
        reason: "INVALID_EMAIL_FORMAT"
      });

      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "email format is invalid"
      });
    }

    const normalizedInterestsResult = normalizeInterestPayload({
      interest_categories,
      interest_keywords,
      requireAtLeastOne: true,
      requireFixedCategories: true
    });

    if (normalizedInterestsResult.error) {
      await auditAuthAttempt({
        action: "REGISTER",
        studentId: student_id,
        success: false,
        reason: "INVALID_INTEREST_PAYLOAD"
      });

      return sendError(res, {
        status: normalizedInterestsResult.error.status,
        code: "VALIDATION_ERROR",
        message: normalizedInterestsResult.error.message,
        details: normalizedInterestsResult.error.details
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
        { email: normalizedEmail }
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
      name: normalizedName,
      email: normalizedEmail,
      student_id: normalizedStudentId,
      password: hashedPassword,
      interest_categories: normalizedInterestsResult.data.interest_categories,
      interest_keywords: normalizedInterestsResult.data.interest_keywords
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
        role: user.role,
        interest_categories: user.interest_categories || [],
        interest_keywords: user.interest_keywords || []
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
          role: user.role,
          interest_categories: user.interest_categories || [],
          interest_keywords: user.interest_keywords || []
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

    const user = await User.findById(req.user.id).select("_id name email student_id role interest_categories interest_keywords");

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
        role: user.role,
        interest_categories: user.interest_categories || [],
        interest_keywords: user.interest_keywords || []
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

    const { name, email, interest_categories, interest_keywords } = req.body || {};
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

      if (!EMAIL_PATTERN.test(trimmedEmail)) {
        return sendError(res, {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "email format is invalid"
        });
      }

      updates.email = trimmedEmail;
    }

    if (interest_categories !== undefined || interest_keywords !== undefined) {
      const normalizedInterestsResult = normalizeInterestPayload({
        interest_categories,
        interest_keywords,
        requireAtLeastOne: false,
        requireFixedCategories: interest_categories !== undefined
      });

      if (normalizedInterestsResult.error) {
        return sendError(res, {
          status: normalizedInterestsResult.error.status,
          code: "VALIDATION_ERROR",
          message: normalizedInterestsResult.error.message,
          details: normalizedInterestsResult.error.details
        });
      }

      const currentUser = await User.findById(req.user.id).select("_id role interest_categories interest_keywords");
      if (!currentUser) {
        return sendError(res, {
          status: 404,
          code: "USER_NOT_FOUND",
          message: "User not found"
        });
      }

      const resolvedInterestCategories = interest_categories !== undefined
        ? normalizedInterestsResult.data.interest_categories
        : (currentUser.interest_categories || []);

      const resolvedInterestKeywords = interest_keywords !== undefined
        ? normalizedInterestsResult.data.interest_keywords
        : (currentUser.interest_keywords || []);

      const requiresInterests = String(currentUser.role || "") !== "Admin";
      if (requiresInterests && resolvedInterestCategories.length + resolvedInterestKeywords.length === 0) {
        return sendError(res, {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "At least one interest is required"
        });
      }

      if (interest_categories !== undefined) {
        updates.interest_categories = resolvedInterestCategories;
      }

      if (interest_keywords !== undefined) {
        updates.interest_keywords = resolvedInterestKeywords;
      }
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
      { returnDocument: "after", runValidators: true }
    ).select("_id name email student_id role interest_categories interest_keywords");

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
        role: user.role,
        interest_categories: user.interest_categories || [],
        interest_keywords: user.interest_keywords || []
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