const express = require('express');
const user_router = express.Router();
const session = require('express-session');
const path = require('path');
const configuration = require('../config/configuration');
user_router.use(session({
    secret:configuration.sessionSecret,
    resave:false,
    saveUninitialized:false
}));

const userController = require('../controllers/authController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const wishlistController = require('../controllers/wishlistController');

const{isLogin,isLogout,nocache} = require('../middleware/auth');



user_router.use(express.json());
user_router.use(express.urlencoded({extended:true}));



user_router.get('/signup',isLogout,userController.loadsignup);
user_router.post('/signup',userController.userSignup);
user_router.get('/verify',isLogout,userController.getVerify);
user_router.post('/verify',userController.verifyOTP);
user_router.get('/',isLogout,userController.loadlogin);
user_router.post('/',userController.loginUser);
user_router.get('/home',isLogin,userController.loadHome);
user_router.get('/blockedUser',userController.blockedUser)
user_router.get('/logout',isLogin,userController.logout);
user_router.get('/forget',userController.loadforgot);
user_router.post('/forget',userController.resetOTP);
user_router.get('/forgot_verify',userController.loadResetVerify);
user_router.post('/forgot_verify',userController.otpVerify);
user_router.post('/resendOTP',userController.resendOTP);
user_router.get('/reset_password',userController.loadResetPassword);
user_router.post('/reset_password',userController.resetPassword);
user_router.get('/products', productController.renderProductByCategory);
user_router.get('/search', productController.searchProducts);
user_router.get('/productDetails',productController.getProductDetails);
user_router.get('/cart',isLogin,cartController.loadCartDetails);
user_router.get('/add-to-cart/:productId',isLogin, cartController.addToCart);
user_router.post('/removeProduct/:id',isLogin,cartController.removeProduct);
user_router.post('/changeQuantity', isLogin,cartController.changeQuantity)
user_router.get('/checkout',isLogin,userController.loadCheckoutPage);
user_router.post('/saveAddress',isLogin,userController.saveAddress);
user_router.post('/removeAddress',isLogin,userController.removeAddress);
user_router.get('/getAddress/:addressId',isLogin,userController.getAddressDetails);
user_router.post('/updateAddress',isLogin,userController.updateAddress);
user_router.post('/placeOrderUsingWallet',isLogin,orderController.placeOrderUsingWallet);
user_router.post('/placeOrderCOD',isLogin,orderController.placeOrderCOD);
user_router.post('/placeOrderOnline',isLogin,orderController.placeOrderOnlinePayment);
user_router.post('/verifyPayment',isLogin,orderController.verifyPayment);
user_router.get('/orderPlaced',isLogin,orderController.loadOrderPlaced);
user_router.get('/myAccount',isLogin,userController.loadUserAccount);
user_router.post('/editMyAccount',isLogin,userController.editMyAccount);
user_router.get('/myAddress',isLogin,userController.loadMyAddress);
user_router.get('/myOrders',isLogin,userController.loadMyOrders);
user_router.get('/myPassword',isLogin,userController.loadMyPassword);
user_router.post('/editMyPassword',isLogin,userController.editMyPassword);
user_router.get('/orderItems/:orderId',isLogin,userController.loadOrderedItems);
user_router.get('/generateInvoice/:orderId',isLogin,userController.generateInvoicePDF);
user_router.get('/cancelOrder/:orderId',isLogin,userController.cancelOrder);
user_router.get('/cancel-product/:orderId/:index',isLogin, userController.cancelProductInOrder);
user_router.post('/applyCoupon',isLogin,couponController.applyCoupon)
user_router.post('/removeCoupon',isLogin,couponController.removeCoupon)
user_router.get('/wishlist',isLogin,wishlistController.loadWishlist);
user_router.get('/add-to-wishlist/:productId',isLogin,wishlistController.addToWishlist);
user_router.post('/remove-from-wishlist/:wishlistId/:productId', wishlistController.removeProduct);
user_router.get('/myWallet',isLogin,userController.loadMyWallet);
user_router.post('/create-razorpay-order',isLogin,userController.addtowallet);
user_router.post('/razorpay-success', isLogin, userController.razorpaySuccess);
user_router.get('/returnOrder/:orderId',isLogin,userController.returnOrder);
user_router.get('/returnProduct/:orderId/:index',isLogin,userController.returnProduct);

module.exports = user_router;

