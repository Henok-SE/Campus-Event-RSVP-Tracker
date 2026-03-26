const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({

title:{
type:String,
required:true
},

description:String,

location:String,

event_date:Date,

status:{
type:String,
default:"Draft"
},

created_by:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

created_at:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("event", eventSchema);