const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  min_bill: {
    type: Number
  },
  cap: {
    type: Number
  },
  used_user: {
    type:[mongoose.Schema.Types.ObjectId],
    ref: 'user'
},

  discount: {
    type: Number,
    required: true,
    default: 0
  },
  expire: {
    type: Date,
    required: true
  }
})

module.exports = mongoose.model('coupons', couponSchema)