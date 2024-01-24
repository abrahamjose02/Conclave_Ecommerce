






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
        


        if(paymentMethod === 'COD'){
            await Order.updateOne({_id:savedOrder._id},{$set:{"payments.pay_id":"COD_" +savedOrder._id}});
            await Cart.updateOne({ user: userId }, { $pull: { items: { product: { $in: cartItemIds } } } });
            console.log('After updating cart:', userId);
            res.json({ status: 'success', order: savedOrder });
        } else{
            var options ={
                amount:totalPriceOfCart,
                currency:"INR",
                reciept:savedOrder._id.toString(),
            };
            instance.orders.create(options,(err,razorpayOrder)=>{
                if(err){
                    console.log(err);
                    return res.status(500).json({status:'error',message:'Failed to create Razorpay Order'});
                }

                Order.updateOne({_id:savedOrder._id},{
                    $set:{
                        "payments.pay_id": razorpayOrder.id,
                        "payments.pay_status":'pending',
                    }
                }).exec();
                res.json({status:'success',order:savedOrder,razorpayOrder})
            })
        }
    } catch (error) {
        console.error('Error placing the order:', error);
        res.status(500).json({ status: 'error', message: 'Failed to place the order' });
    }
};


const verifyPayment =async(req,res)=>{
    try {
        const userId = req.session.user_id;
        const orderId = req.body.order.reciept;
        const razorpayOrderId = req.body.payment.razorpay_order_id;
        const razorpayPaymentId = req.body.payment.razorpay_payment_id;
        const razorpaySignature = req.body.payment.razorpay_signature;

        let hmac = crypto.createHmac('sha256',KEY_SECRET);
        hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
        hmac = hmac.digest('hex');

        if(hmac === razorpaySignature){
            const updateData ={
                orderStatus:'placed',
                "payments.pay_status":'success',
                "payments.pay_id" : razorpayPaymentId
            };

            await Order.updateOne({_id:orderId,user:userId},{$set:updateData});
            await Cart.updateOne({ user: userId }, { $pull: { items: { product: { $in: cartItemIds } } } });
            res.json({status:true});
        } else{
            const updateData = {
                orderStatus:'failed',
                "payments.pay_status":'failed',
                "payments.pay_id":'failed'
            };
            await Order.updateOne({_id:orderId,user:userId},{$set:updateData});
            res.json({status:false,errMssg:''});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({message:'Invalid Session Error'});
    }
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






$(document).ready(function () {
    console.log('Script loaded and executed.');

    $('#placeOrder').on('click', function () {
        // Get the selected address and payment method
        const selectedAddress = $('input[name="order-address"]:checked').val();
        const selectedPaymentMethod = $('input[name="paymentMethod"]:checked').val();

        // Validate if an address and payment method are selected
        if (!selectedAddress || !selectedPaymentMethod) {
            console.log('Please select both an address and a payment method.');
            return;
        }

        const itemsInCart = [];
        $('.checkout__total__products li').each(function () {
            // Assuming each li element has a data attribute containing the cart item
            const cartItem = $(this).data('cart-item');

            if (cartItem && cartItem.product && cartItem.product._id) {
                const productId = cartItem.product._id;
                const productName = cartItem.product.name;
                const quantity = cartItem.quantity; // Use cartItem.quantity directly

                itemsInCart.push({ product: { _id: productId, name: productName }, quantity: quantity });
            } else {
                console.error('Invalid cart item:', cartItem);
            }
        });

        // Get total price from the page and parse it as a number
        const totalPriceText = $('.checkout__total__all li:last span').text().trim();
        const totalPriceOfCart = parseFloat(totalPriceText.replace(/[^\d.]/g, ''));

        if (isNaN(totalPriceOfCart)) {
            console.error('Invalid totalPriceOfCart:', totalPriceOfCart);
            return;
        }

        // Perform AJAX POST request to place the order
        $.ajax({
            url: '/placeOrder',
            method: 'post',
            contentType: 'application/json',
            data: JSON.stringify({
                addressId: selectedAddress,
                paymentMethod: selectedPaymentMethod,
                itemsInCart: itemsInCart,
                totalPriceOfCart: totalPriceOfCart
            }),
            success: function (response) {
                console.log('AJAX success:', response);
                if (response.status === 'success') {
                    Swal.fire(
                        'Success',
                        'Your order is placed',
                        'success'
                    ).then(() => {
                        location.href = '/orderPlaced'; // Update the redirect URL
                    });
                } else if(response.outOfStock){
                    console.error('AJAX error:', response);
                    Swal.fire(
                        'Sorry',
                        'One or many of the selected products are out of stock',
                        'error'
                    ).then(()=>{
                        location.href ='/cart';
                    });  
                } else {
                    if (selectedPaymentMethod !== 'COD') {
                        // If payment method is not COD, initiate Razorpay payment
                        handleRazorpayPayment(response.order);
                    } else {
                        // If payment method is COD, proceed with order placement
                        handleCodPayment(response.order);
                    }
                }
            },
            error: function (error) {
                console.error('AJAX request error:', error);
            }
        });
    });

    function handlePayment(order) {
        if (order.paymentMethod === 'COD') {
            handleCodPayment(order);
        } else {
            handleRazorpayPayment(order);
        }
    }

    function handleCodPayment(order) {
        $.ajax({
            url: '/verifyPayment',
            method: 'post',
            data: {
                payment: {
                    razorpay_order_id: 'COD_' + order._id,
                    razorpay_payment_id: 'COD_' + order._id,
                    razorpay_signature: 'COD_SIGNATURE'
                },
                order: { reciept: order._id }
            },
            success: function (response) {
                handlePaymentResponse(response);
            }
        });
    }

    function handleRazorpayPayment(order) {
        var options = {
            "key": 'rzp_test_bKd6wx7eUIbfAM',
            "amount": order.totalPrice * 100, // Amount should be in paise
            "currency": "INR",
            "name": "Conclave - Fashion Ecommerce",
            "description": "A fashion and Apparel Ecommerce brand",
            "image": "/img/logo.png",
            "order_id": order.payments.pay_id,
            "handler": function (response) {
                verifyPayment(response, order);
            },
            "prefills": {
                "name": order.address.fullName,
                "email": "abraham@example.com",
                "contact": "9000090000"
            },
            "notes": {
                "address": "Razorpay Corporate Office"
            },
            "theme": {
                "color": "#3399cc"
            }
        };

        var rzp1 = new Razorpay(options);

        rzp1.on('payment.failed', function (response) {
            handlePaymentFailed();
        });

        rzp1.open();
    }

    function verifyPayment(payment, order) {
        $.ajax({
            url: '/verifyPayment',
            method: 'post',
            data: {
                payment,
                order
            },
            success: function (response) {
                console.log('Verify Payment Response:', response); // Log the response
                handlePaymentResponse(response);
            }
        });
    }

    function handlePaymentFailed() {
        Swal.fire(
            'Failed',
            'Payment Failed',
            'error'
        ).then(() => {
            location.href = '/cart';
        });
    }

    function handlePaymentResponse(response) {
        if (response.status) {
            Swal.fire(
                'Success',
                'Payment success, your order is placed',
                'success'
            ).then(() => {
                location.href = '/orderPlaced';
            });
        } else {
            handlePaymentFailed();
        }
    }
});