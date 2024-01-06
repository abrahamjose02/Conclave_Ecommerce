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
const{isLogin,isLogout,nocache} = require('../middleware/auth');



user_router.use(express.json());
user_router.use(express.urlencoded({extended:true}));



user_router.get('/signup',isLogout,userController.loadsignup);
user_router.post('/signup',userController.userSignup);
user_router.get('/verify',isLogout,nocache,userController.getVerify);
user_router.post('/verify',userController.verifyOTP);
user_router.get('/',isLogout,nocache,userController.loadlogin);
user_router.post('/',userController.loginUser);
user_router.get('/home',isLogin,nocache,userController.loadHome);
user_router.get('/blockedUser',userController.blockedUser)
user_router.get('/logout',isLogin,nocache,userController.logout);
user_router.get('/forget',userController.loadforgot);
user_router.post('/forget',userController.resetOTP);
user_router.get('/forgot_verify',userController.loadResetVerify);
user_router.post('/forgot_verify',userController.otpVerify);
user_router.get('/reset_password',userController.loadResetPassword);
user_router.post('/reset_password',userController.resetPassword);
user_router.get('/products', userController.renderProductByCategory);
user_router.get('/productDetails',userController.getProductDetails);
user_router.get('/myAccount',userController.loadUserAccount);
user_router.post('/resendOTP',userController.resendOTP);
  





module.exports = user_router;

