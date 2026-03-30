const mongoose = require("mongoose");

const rsvpSchema = new mongoose.Schema({

user_id:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

event_id:{
type:mongoose.Schema.Types.ObjectId,
ref:"Event"
},

rsvp_date:{
type:Date,
default:Date.now
},

qr_code:String,

status:{
type:String,
default:"Confirmed"
}

});

rsvpSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

module.exports = mongoose.model("RSVP", rsvpSchema);