const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Razorpay = require('razorpay');

const { KEY_ID, KEY_SECRET } = process.env;

const instance = new Razorpay({
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

const placeOrderUsingWallet = async (req, res) => {
    try {
        console.log("Place order request received with body:", req.body);
        
        // Check if the request body is empty or missing required fields
        if (!req.body || !req.body.addressId || !req.body.itemsInCart) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        
        const { addressId, itemsInCart, useWallet } = req.body;
        const userId = req.session.user_id;
        const paymentMethod = 'Wallet'; // Set payment method to Wallet

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

        const status = 'placed'; // Orders paid with wallet are directly placed

        let grandTotal = totalPriceOfCart;
        let discountAmount = 0;

        if (req.session.couponDetails) {
            grandTotal = req.session.couponDetails.newTotal || totalPriceOfCart;
            discountAmount = req.session.couponDetails.discount || 0;
        }

        // Deduct the wallet balance for the wallet total
        let payableAmount = grandTotal;
        if (useWallet && user.wallet >= grandTotal) {
            user.wallet -= grandTotal;
            payableAmount = 0;
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
                pay_status: 'success', // For Wallet, the payment status is always success
            },
            items: orderItems,
            orderStatus: status,
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

        await Order.updateOne({ _id: savedOrder._id }, { $set: { "payments.pay_id": `${paymentMethod}_${savedOrder._id}` } });
        await Cart.deleteOne({ user: userId });


        console.log("Order placed successfully using wallet.");
        return res.json({ orderPlaced: true });
    } catch (error) {
        console.error('Error placing the order using wallet:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to place the order using wallet', error: error.message });
    }
};


const placeOrderCOD = async (req, res) => {
    try {
        console.log("Place order request received with body:", req.body);
        
        // Check if the request body is empty or missing required fields
        if (!req.body || !req.body.addressId || !req.body.itemsInCart) {
            return res.status(400).json({ error: 'Invalid request body' });
        }
        
        const { addressId, itemsInCart,useWallet } = req.body;
        const userId = req.session.user_id;
        const paymentMethod = 'COD'; // Set payment method to COD for COD orders

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

        const status = 'placed'; // COD orders are directly placed

        let grandTotal = totalPriceOfCart;
        let discountAmount = 0;

        if (req.session.couponDetails) {
            grandTotal = req.session.couponDetails.newTotal || totalPriceOfCart;
            discountAmount = req.session.couponDetails.discount || 0;
        }

        // Deduct the wallet balance for the wallet total
        let payableAmount = grandTotal;
        if (user.wallet& useWallet > grandTotal) {
            user.wallet -= grandTotal;
            payableAmount = 0;
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
                pay_status: 'success', // For COD, the payment status is always success
            },
            items: orderItems,
            orderStatus: status,
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

        await Order.updateOne({ _id: savedOrder._id }, { $set: { "payments.pay_id": `${paymentMethod}_${savedOrder._id}` } });
        await Cart.deleteOne({ user: userId });

        console.log("Order placed successfully.");
        return res.json({ orderPlaced: true });
    } catch (error) {
        console.error('Error placing the COD order:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to place the COD order', error: error.message });
    }
};


const placeOrderOnlinePayment = async (req, res) => {
    try {
        console.log("Place order request received with body:", req.body);

        // Check if the request body is empty or missing required fields
        if (!req.body || !req.body.addressId || !req.body.itemsInCart) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const { addressId, itemsInCart } = req.body;
        const userId = req.session.user_id;
        const paymentMethod = 'Online'; // Set payment method to Online for online payment orders

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

        }

        const user = await User.findById(userId);
        const selectedAddress = user.addresses.id(addressId);

        const status = 'pending'; // Online payment orders initially have a pending status

        let grandTotal = totalPriceOfCart;
        let discountAmount = 0;

        if (req.session.couponDetails) {
            grandTotal = req.session.couponDetails.newTotal || totalPriceOfCart;
            discountAmount = req.session.couponDetails.discount || 0;
        }

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

        // Create order data object without saving it yet
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

        // Save orderData in the session
        req.session.orderData = orderData;

        // Create options for Razorpay order
        const options = {
            amount: orderData.payable_amount * 100, // Multiply by 100 to convert to paisa
            currency: "INR",
            receipt: "" + randomOrderId // Using the random order ID for the receipt
        };

        // Creating the Razorpay order
        instance.orders.create(options, async (err, razorpayOrder) => {
            if (err) {
                console.error('Error creating Razorpay order:', err);
                return res.status(500).json({ status: 'error', message: 'Failed to create Razorpay order' });
            } else {
                // Once the Razorpay order is successfully created, send it back to the client along with other necessary data
                console.log('Razorpay Order created:', razorpayOrder);
                console.log('Order Data:', orderData);
                return res.json({ razorpayOrder, orderData });// Include payableAmount in the response
            }
        });
    } catch (error) {
        console.error('Error placing the online payment order:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to place the online payment order', error: error.message });
    }
};


const verifyPayment = async (req, res) => {
    try {
        const payment = req.body.payment;
        // Retrieve orderData from the session
        const orderData = req.session.orderData;

        console.log('Received request body:', req.body);
        console.log('Received order data from session:', orderData);

        // Check if orderData is defined and has a payments property
        if (orderData && orderData.payments) {
            // Calculate HMAC signature using the same secret key used in the client-side code
            const calculatedSignature = calculateHmacSignature(payment.razorpay_order_id, payment.razorpay_payment_id, 'lftWB1YzoyY7aS8JgxMmgsMw');

            console.log('Calculated HMAC Signature:', calculatedSignature);
            console.log('Received HMAC Signature:', payment.razorpay_signature);

            // Check if HMAC signature matches
            if (calculatedSignature === payment.razorpay_signature) {
                // Payment verification successful
                // Update order status and payment details
                orderData.payments.pay_status = 'success';
                orderData.payments.pay_id = payment.razorpay_payment_id;
                orderData.orderStatus = 'placed';
                // Save the order with updated payment status
                const newOrder = new Order(orderData);
                await newOrder.save();

                // Reduce stock quantity
                for (const cartItem of orderData.items) {
                    const product = await Product.findById(cartItem.product);
                    const selectedSize = product.sizes.find(size => size.size === cartItem.size);
                    selectedSize.stock -= cartItem.quantity;
                    await product.save();
                }

                // Delete the cart after successful verification
                // Assuming you have a Cart model with a method to delete the cart for a specific user
                await Cart.deleteOne({ user: req.session.user_id });

                console.log('Payment verified and order placed successfully.');

                // Send success response
                return res.status(200).json({ status: 'success', message: 'Payment verified and order placed successfully.', paymentStatus: 'verified', redirect: '/orderPlaced' }); // Added redirect URL
            } else {
                // HMAC signature mismatch, payment verification failed.

                // Revert wallet balance if payment verification fails
                const user = await User.findById(req.session.user_id);
                if (orderData.payable_amount === 0) {
                    // If payable amount is 0, add back the grand total amount
                    user.wallet += orderData.grand_total;
                } else {
                    // Add back the difference between grand total and payable amount to the wallet
                    const difference = orderData.grand_total - orderData.payable_amount;
                    user.wallet += difference;
                }
                await user.save();

                console.log('HMAC signature mismatch. Payment verification failed.');

                // Show SweetAlert and redirect to cart
                return res.status(200).json({ status: 'error', message: 'Payment verification failed.', paymentStatus: 'failed', redirect: '/checkout' }); // Added redirect URL
            }
        } else {
            // orderData or payments property is undefined, handle the error
            console.error('orderData or payments property is undefined');

            // Revert wallet balance if payment verification fails
            const user = await User.findById(req.session.user_id);
            if (orderData && orderData.payable_amount === 0) {
                // If payable amount is 0, add back the grand total amount
                user.wallet += orderData.grand_total;
            } else if (orderData && orderData.payable_amount > 0) {
                // Add back the difference between grand total and payable amount to the wallet
                const difference = orderData.grand_total - orderData.payable_amount;
                user.wallet += difference;
            }
            await user.save();

            return res.status(500).json({ status: 'error', message: 'Internal server error during payment verification', paymentStatus: 'initiated', redirect: '/checkout' }); // Added redirect URL
        }
    } catch (error) {
        console.error('Error during payment verification:', error);
        
        // Revert wallet balance if payment verification fails
        const user = await User.findById(req.session.user_id);
        if (orderData && orderData.payable_amount === 0) {
            // If payable amount is 0, add back the grand total amount
            user.wallet += orderData.grand_total;
        } else if (orderData && orderData.payable_amount > 0) {
            // Add back the difference between grand total and payable amount to the wallet
            const difference = orderData.grand_total - orderData.payable_amount;
            user.wallet += difference;
        }
        await user.save();

        // Send error response
        return res.status(500).json({ status: 'error', message: 'Internal server error during payment verification', paymentStatus: 'initiated', redirect: '/cart' }); // Added redirect URL
    }
};



// Function to calculate HMAC signature
const calculateHmacSignature = (orderId, paymentId, secretKey) => {
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(orderId + '|' + paymentId);
    return hmac.digest('hex');
}




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
    loadOrderPlaced,
    loadSalesReport,
    placeOrderCOD,
    placeOrderOnlinePayment,
    placeOrderUsingWallet
}