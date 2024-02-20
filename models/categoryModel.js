
const mongoose = require('mongoose');
const { schema } = require('./userModel');


const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        default: '',
      },
      categoryType: {
        type: String,
        required: true,
        enum: ['Men', 'Women', 'Kids', 'Beauty'], 
      },
      image:{
        type:String,
        required:true,
      },
      isDeleted: {
        type: Boolean,
        default: false,
      },
      isOfferApplied:{
        type:Boolean,
        default:false
      },
      discountPercentage:{
        type:Number,
        default:0
      },
      dateCreated: {
        type: Date,
        default: Date.now,
      }
})


module.exports = mongoose.model('category',categorySchema);