const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({

event_id:{
type:mongoose.Schema.Types.ObjectId,
ref:"Event"
},

user_id:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

check_in_time:{
type:Date,
default:Date.now
},

validation_method:String

});

attendanceSchema.index({ event_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);