const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Student", studentSchema);