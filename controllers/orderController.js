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


const getCategoryiesByType = async (categoryType) => {
    try {
      const categories = await Category.aggregate([
        {
          $match: {
            categoryType: categoryType,
            isDeleted: false
          },
        },
      ]);
      return categories;
    } catch (error) {
      console.error('Error', error);
      throw error;
    }
  }



  const placeOrder = async (req, res) => {
    try {
        console.log("Place order request received with body:", req.body);
        
        // Check if the request body is empty or missing required fields
        if (!req.body || !req.body.addressId || !req.body.paymentMethod || !req.body.itemsInCart) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        
        const { addressId, paymentMethod, itemsInCart } = req.body;
        const userId = req.session.user_id;

        // Check stock availability
        const isStockAvailable = await Promise.all(itemsInCart.map(async (cartItem) => {
            const product = await Product.findById(cartItem.product._id);
            if (!product) {
                return false; // Invalid product
            }
            const selectedSize = product.sizes.find(size => size.size === cartItem.size);
            return selectedSize && selectedSize.stock >= cartItem.quantity;
        }));

        if (!isStockAvailable.every((availability) => availability)) {
            req.session.message = {
                type: 'danger',
                message: 'Some products in your cart are out of stock.',
            };
            return res.status(400).json({ outOfStock: true });
        }

        const orderItems = [];
        let totalPriceOfCart = 0;

        for (const cartItem of itemsInCart) {
            const product = await Product.findById(cartItem.product._id);

            if (!product) {
                console.error(`Product not found for ID: ${cartItem.product._id}`);
                return res.status(400).json({ status: 'error', message: 'Invalid product in cart' });
            }

            const itemPrice = product.price * cartItem.quantity;

            orderItems.push({
                product: product._id,
                quantity: cartItem.quantity,
                size: cartItem.size,
                price: product.price
            });

            totalPriceOfCart += itemPrice;

            // reduce the stock count of the product
            const selectedSize = product.sizes.find(size => size.size === cartItem.size);
            selectedSize.stock -= cartItem.quantity;
            await product.save();
        }

        const user = await User.findById(userId);
        const selectedAddress = user.addresses.id(addressId);

        let status = paymentMethod === 'COD' ? 'placed' : 'pending';

        let grandTotal = totalPriceOfCart;
        let discountAmount = 0;

        if (req.session.couponDetails) {
            grandTotal = req.session.couponDetails.newTotal || totalPriceOfCart;
            discountAmount = req.session.couponDetails.discount || 0;
        }

        // Deduct the wallet balance for the wallet total
        let payableAmount = grandTotal;
        if (user.wallet > grandTotal) {
            user.wallet -= grandTotal;
            payableAmount = 0;
        } else {
            payableAmount -= user.wallet;
            user.wallet = 0;
        }

        await user.save();

        const randomOrderId = Math.floor(Math.random() * 1000000); // Generates a random number between 0 and 999999

        const orderData = {
            user: userId,
            orderID: randomOrderId,
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
                pay_method: paymentMethod,
                pay_id: null,
                pay_status: payableAmount === 0 ? 'success' : 'pending', // Set payment status based on payable amount
            },
            items: orderItems,
            orderStatus: payableAmount === 0 ? 'placed' : status, // Set order status based on payable amount
            orderDate: new Date(),
            coupon: req.session.couponDetails || {},
            totalPrice: totalPriceOfCart,
            discount_amount: discountAmount,
            grand_total: grandTotal,
            payable_amount: payableAmount
        };

        const order = new Order(orderData);
        const savedOrder = await order.save();

        if (req.session.couponDetails) {
          delete req.session.couponDetails;
      }

        // Handle payment method
        if (paymentMethod === 'COD' || payableAmount === 0) {
            await Order.updateOne({ _id: savedOrder._id }, { $set: { "payments.pay_id": `${paymentMethod}_${savedOrder._id}`, "payments.pay_status": "success" } });
            await Cart.deleteOne({ user: userId });
            console.log("Order placed successfully.");
            return res.json({ orderPlaced: true });
        } else {
            var options = {
                amount: savedOrder.payable_amount * 100,
                currency: "INR",
                receipt: "" + savedOrder._id
            };
            instance.orders.create(options, async (err, order) => {
                if (err) {
                    console.error('Error creating order:', err);
                    return res.status(500).json({ status: 'error', message: 'Failed to create order' });
                } else {
                    await Cart.deleteOne({ user: userId });
                    console.log("Order created successfully:", order);
                    return res.json(order);
                }
            });
        }
    } catch (error) {
        console.error('Error placing the order:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to place the order', error: error.message });
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


const getSalesReport = async (timeframe) => {
    try {
        let filter = {};
        
        if (timeframe === 'daily') {
            filter = {
                orderDate: {
                    $gte: new Date(new Date().setHours(0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59)),
                },
            };
        } else if (timeframe === 'weekly') {
            filter = {
                orderDate: {
                    $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
                },
            };
        } else if (timeframe === 'monthly') {
            filter = {
                orderDate: {
                    $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                },
            };
        }

        const salesData = await Order.find(filter).populate('user').sort({ orderDate: -1 });
        return salesData;
    } catch (error) {
        console.error('Error fetching sales report:', error);
        throw error;
    }
};

const loadSalesReport = async (req, res) => {
    try {
        let message = '';
        const menCategories = await getCategoryiesByType('Men');
        const womenCategories = await getCategoryiesByType('Women');
        const kidsCategories = await getCategoryiesByType('Kids');
        const beautyCategories = await getCategoryiesByType('Beauty');

        const timeframe = req.query.timeframe || 'daily';
        const salesData = await getSalesReport(timeframe);

        const grandTotal = salesData.reduce((total, val) => total + val.totalPrice, 0);

        res.render('salesReport', {
            menCategories,
            womenCategories,
            kidsCategories,
            beautyCategories,
            message,
            salesData,
            grandTotal,
            calculateTotalPrice: (data) => data.reduce((total, val) => total + val.totalPrice, 0),
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Invalid Session Error' });
    }
};



module.exports = {
    verifyPayment,
    placeOrder,
    loadOrderPlaced,
    loadSalesReport
}