const { Timestamp } = require('mongodb');
const mongoose = require('mongoose');


const otpSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
   otp:{
    type: String,
    required:true
   },
   Date:{
    type: Date,
    default: Date.now,
    required:true,
    
   }
})

module.exports = mongoose.model('otpData',otpSchema)