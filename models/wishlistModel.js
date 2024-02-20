
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    items:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'product'
            },
            size:{
                type:String,
                required:true
            },
            quantity:{
                type:Number,
                required:true,
                default:1
            }
        }
    ]
})

module.exports = mongoose.model('wishlist',wishlistSchema);