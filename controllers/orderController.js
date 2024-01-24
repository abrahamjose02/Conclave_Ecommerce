const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const razorpay = require('razorpay');

const { KEY_ID, KEY_SECRET } = process.env;

const instance = new razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET
});
const crypto = require('crypto');

const placeOrder = async (req, res) => {
    try {
        const { addressId, paymentMethod, itemsInCart } = req.body;
        const userId = req.session.user_id;

        const orderItems = [];
        let totalPriceOfCart = 0;

        for (const cartItem of itemsInCart) {
            console.log('CartItem:', cartItem);

            // Assuming each cartItem has _id, name, and quantity properties
            const product = await Product.findById(cartItem.product._id);

            if (!product) {
                console.error(`Product not found for ID: ${cartItem.product._id}`);
                return res.status(400).json({ status: 'error', message: 'Invalid product in cart' });
            }

            const itemPrice = product.price * cartItem.quantity;
            console.log('itemPrice:', itemPrice);
            console.log('cartQuantity:', cartItem.quantity);

            orderItems.push({
                product: product._id,
                quantity: cartItem.quantity,
                price: product.price
            });

            totalPriceOfCart += itemPrice;
        }

        const user = await User.findById(userId);
        const selectedAddress = user.addresses.id(addressId);

        let status = paymentMethod === 'COD' ? 'placed' : 'pending';

        const orderData = {
            user: userId,
            address: {
                fullName: selectedAddress.fullName,
                country: selectedAddress.country,
                addressLine: selectedAddress.addressLine,
                locality: selectedAddress.locality,
                city: selectedAddress.city,
                state: selectedAddress.state,
                pinCode: selectedAddress.pinCode,
                phone: selectedAddress.phone,
            },
            payments: {
                pay_method:paymentMethod,
                pay_id:null,
                pay_status:'pending',
            },
            items: orderItems,
            totalPrice: totalPriceOfCart,
            orderStatus: status,
            orderDate: new Date(),
        };

        const order = new Order(orderData);
        const savedOrder = await order.save();

        const cartItemIds = itemsInCart.map(cartItem => cartItem.product._id);

        console.log('Before updating cart:', userId, cartItemIds);
        


        if (paymentMethod === 'COD') {
            // If payment is Cash on Delivery (COD)
            await Order.updateOne({_id: savedOrder._id}, {$set: {"payments.pay_id": "COD_" + savedOrder._id, "payments.pay_status": "success"}});
            await Cart.deleteOne({ user: userId });
            console.log('After updating cart:', userId);
            return res.json({codSuccess: true});
        } 
            else {
                
                var options = {
                    amount: savedOrder.totalPrice * 100,
                    currency: "INR",
                    receipt: "" + savedOrder._id
                };
                console.log('Amount:', savedOrder.totalPrice * 100);
                instance.orders.create(options, (err, order) => {
                    if (err) {
                        console.log(err);
                    } else{
                        return res.json(order);
                    }
                    
                });
            }
        
    } catch (error) {
        console.error('Error placing the order:', error);
        res.status(500).json({status: 'error', message: 'Failed to place the order'});
    }
};

const verifyPayment = async (req, res) => {
    try {
        const userId = req.session.user && req.session.user._id; // Assuming you have user ID in the session
        const hmac = crypto.createHmac('sha256', KEY_SECRET);
        
        hmac.update(req.body.payment.razorpay_order_id + '|' + req.body.payment.razorpay_payment_id);
        const calculatedSignature = hmac.digest('hex');
    
        console.log('Calculated Signature:', calculatedSignature);
        console.log('Received Signature:', req.body.payment.razorpay_signature);

        if (calculatedSignature === req.body.payment.razorpay_signature) {
          const orderId = req.body.order.receipt;
    
          console.log('Signature matched. Updating order status to "placed".');
          await Order.updateOne({ _id: orderId }, { $set: { orderStatus: 'placed', "payments.pay_status": 'success', "payments.pay_id": req.body.payment.razorpay_payment_id } });
    
          console.log('Deleting user cart.');
          await Cart.deleteOne({ user: userId });
    
          console.log('Payment verification successful. Sending response with status: true.');
          return res.json({ status: true });
        } else {
          const orderId = req.body.order.receipt;
    
          console.log('Signature mismatch. Updating order status to "failed".');
          await Order.updateOne({ _id: orderId }, { $set: { orderStatus: 'failed', "payments.pay_status": 'failed', "payments.pay_id": "failed" } });
    
          console.log('Payment verification failed. Sending response with status: false.');
          return res.json({ status: false, errMsg: 'Signature mismatch or other verification issue' });
        }
    } catch (error) {
        console.error('Error during payment verification:', error);
        return res.status(500).json({ status: false, errMsg: 'Internal server error during payment verification' });
    }
};





const loadOrderPlaced = async (req, res) => {
    try {
        const userID = req.session.user_id;
        const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
        const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
        const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
        const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });
        let message = '';
        res.render('orderPlaced', { userID, menCategories, womenCategories, kidsCategories, beautyCategories, message });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Invalid Session Error' });
    }
}



module.exports = {
    verifyPayment,
    placeOrder,
    loadOrderPlaced,
}