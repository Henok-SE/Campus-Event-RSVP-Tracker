const mongoose = require("mongoose");

const authAuditSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ["REGISTER", "LOGIN"]
  },
  student_id: {
    type: String,
    default: ""
  },
  success: {
    type: Boolean,
    required: true
  },
  reason: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

authAuditSchema.index({ created_at: -1 });
authAuditSchema.index({ student_id: 1, created_at: -1 });

module.exports = mongoose.model("AuthAudit", authAuditSchema);
