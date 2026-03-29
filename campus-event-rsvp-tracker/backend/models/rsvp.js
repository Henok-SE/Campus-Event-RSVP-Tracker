const mongoose = require("mongoose");

const rsvpSchema = new mongoose.Schema({

 student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
},

event_id:{
type:mongoose.Schema.Types.ObjectId,
ref:"Event"
},

rsvp_date:{
type:Date,
default:Date.now
},

status:{
type:String,
default:"Confirmed"
}

});
rsvpSchema.index({ student_id: 1, event_id: 1 }, { unique: true });

module.exports = mongoose.model("rsvp", rsvpSchema);