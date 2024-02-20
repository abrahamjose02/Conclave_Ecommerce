
const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    orderID:{
        type:Number,
        required:true
    },
    address: {
        fullName: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        addressLine: {
            type: String,
            required: true
        },
        locality: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pinCode: {
            type: Number,
            required: true
        },
        phone: {
            type: Number,
            required: true
        },
    },

    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true
            },
            size:{
                type:String,
                required:true
            },
            price:{
                type:Number,
                required: true
            },
            returned:{
                type:Boolean,
                default:false
            },
            cancelled:{
                type:Boolean,
                default:false
            }
        },
    ],
    orderStatus: {
        type: String,
        enum: ['pending', 'placed', 'shipped', 'delivered', 'cancelled','returned'], 
        default:'pending',
        required: true,
    },

    payments:{
        pay_method:{
            type:String,
        },
        pay_id:{
            type:String
        },
        pay_status:{
            type:String
        }
    },
    coupon: {
        name: { type: String },
        code: { type: String },
        discount: { type: Number },
    },
    totalPrice: {
        type: Number,
    },
    discount_amount: {
        type: Number,
    },
    grand_total: {
        type: Number,
    },
    payable_amount:{
        type:Number
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('order', orderSchema);

