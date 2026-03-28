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
enum:["Draft", "Published", "Ongoing", "Completed", "Cancelled"],
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

eventSchema.index({ created_by: 1, event_date: 1 });

module.exports = mongoose.model("Event", eventSchema);