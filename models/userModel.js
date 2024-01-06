const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    address:{
        type:String,
    },
    isadmin:{
        type:Number,
        default:0
    },
    isblocked:{
        type:Boolean,
        default:false
    }
})

module.exports = mongoose.model('user',userSchema);