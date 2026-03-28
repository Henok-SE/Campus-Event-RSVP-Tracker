

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");

exports.register = async (req, res) => {
  try {
    const { name, email, student_id, password } = req.body;

    if (!name || !email || !student_id || !password) {
      return res.status(400).json({ message: "name, email, student_id, and password are required" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      student_id,
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email });

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