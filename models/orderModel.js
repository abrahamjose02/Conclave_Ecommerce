
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
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


    paymentMethod: {
        type: String,
        required: true
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
        },
    ],
    totalPrice: {
        type: Number,
        required: true,
    },
    orderStatus: {
        type: String,
        default: 'pending'
    },
    orderDate: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('order', orderSchema);

