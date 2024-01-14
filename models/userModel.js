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
    },
    addresses:[{
        fullName:{
            type:String,
            required:true
        },
        country:{
            type:String,
            required:true
        },
        addressLine:{
            type:String,
            required:true
        },
        locality:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        pinCode:{
            type:Number,
            required:true
        },
        phone:{
            type:Number,
            required:true
        }
    }]
})

module.exports = mongoose.model('user',userSchema);