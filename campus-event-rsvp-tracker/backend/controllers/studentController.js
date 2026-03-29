const Student = require("../models/student");

// Create a new student
exports.createStudent = async (req, res) => {
  try {
    const { student_id, email, name } = req.body;
    
    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [{ email }, { student_id }]
    });
    
    if (existingStudent) {
      return res.status(400).json({ 
        message: "Student with this email or student ID already exists" 
      });
    }
    
    const student = new Student({
      student_id,
      email,
      name
    });
    
    await student.save();
    
    res.status(201).json({ 
      message: "Student created successfully", 
      student 
    });
    
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ 
      message: "Error creating student", 
      error: error.message 
    });
  }
};

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ created_at: -1 });
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ 
      message: "Error fetching students", 
      error: error.message 
    });
  }
};

// Get student by student_id
exports.getStudentByStudentId = async (req, res) => {
  try {
    const student = await Student.findOne({ student_id: req.params.studentId });
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ 
      message: "Error fetching student", 
      error: error.message 
    });
  }
};

// Get student by email
exports.getStudentByEmail = async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.params.email });
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ 
      message: "Error fetching student", 
      error: error.message 
    });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { student_id, email, name } = req.body;
    
    // Check if updating to an email or student_id that already exists (excluding current student)
    if (email || student_id) {
      const existingStudent = await Student.findOne({
        $or: [],
        _id: { $ne: req.params.id }
      });
      
      if (email) {
        existingStudent.$or.push({ email });
      }
      if (student_id) {
        existingStudent.$or.push({ student_id });
      }
      
      if (existingStudent.$or.length > 0) {
        const duplicate = await Student.findOne({
          $or: existingStudent.$or,
          _id: { $ne: req.params.id }
        });
        
        if (duplicate) {
          return res.status(400).json({ 
            message: "Student with this email or student ID already exists" 
          });
        }
      }
    }
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { student_id, email, name },
      { new: true, runValidators: true }
    );
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.json({ 
      message: "Student updated successfully", 
      student 
    });
    
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ 
      message: "Error updating student", 
      error: error.message 
    });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ 
      message: "Error deleting student", 
      error: error.message 
    });
  }
};

// Search students by name
exports.searchStudents = async (req, res) => {
  try {
    const { query } = req.query;
    
    const students = await Student.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { student_id: { $regex: query, $options: "i" } }
      ]
    });
    
    res.json(students);
  } catch (error) {
    console.error("Error searching students:", error);
    res.status(500).json({ 
      message: "Error searching students", 
      error: error.message 
    });
  }
};