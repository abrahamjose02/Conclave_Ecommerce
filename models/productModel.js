const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        required:true,
        default:''
    },
    size:{
        type: [String],
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL','Single Size'], 
        default: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],  
        required: true
    },
    brand:{
        type:String,
        required:true,
    },
    stockinCount:{
        type:Number,
        required:true,
        min:0,
        max:255
    },
    price:{
        type:Number,
        required:true,
        default:0
    },
    color:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'category',
        required:true
    },
    
    images:
        {
            type:Array,
            required:true
        },
    isDeleted:{
        type:Boolean,
        default:false
    },
    rating:{
        type:Number,
        default:0
    },
    isFeatured:{
        type:Boolean,
        default:false
    },
    dateCreated:{
        type:Date,
        default:Date.now
    }
}) 

module.exports = mongoose.model('product',productSchema);