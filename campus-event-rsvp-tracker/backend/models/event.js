const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({

title:{
type:String,
required:true
},

description:String,

location:String,

event_date:Date,

time: {
type: String,
trim: true
},

capacity: {
type: Number,
min: 1
},

category: {
type: String,
trim: true
},

tags: [{
type: String,
trim: true
}],

image_url: {
type: String,
trim: true
},

attending_count: {
type: Number,
default: 0,
min: 0
},

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