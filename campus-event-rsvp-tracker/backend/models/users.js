const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

email:{
type:String,
unique:true,
required:true
},

student_id:{
  type:String,
  required:true,
  unique:true
},

password:{
type:String,
required:true
},

role:{
type:String,
default:"Student"
},

created_at:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("users", userSchema);