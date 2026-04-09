const mongoose = require("mongoose");
const { FIXED_INTEREST_CATEGORIES } = require("../config/interestOptions");

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

interest_categories:[{
type:String,
enum:FIXED_INTEREST_CATEGORIES,
trim:true
}],

interest_keywords:[{
type:String,
trim:true,
lowercase:true
}],

created_at:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("User", userSchema);