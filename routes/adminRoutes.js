const express = require('express');
const admin_route = express.Router();
const session = require('express-session');
const path = require('path');

const configuration = require('../config/configuration');
const {isLogin,isLogout,nocache} = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const bannerController = require('../controllers/bannerController');


admin_route.use(session({
    secret:configuration.sessionSecret,
    resave:false,
    saveUninitialized:false
}));



admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}));




const multer = require('multer');
const { errorPage } = require('../controllers/authController');

// const imgtypes = /jpg|jpeg|svg|png|webp/;

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function(req, file, cb) {
        const name = Date.now() + path.extname(file.originalname);
        cb(null, name);
    }
});

// const fileFilter = (req, file, cb) => {
    

//     const extName = imgtypes.test(path.extname(file.filename).toLowerCase());
//     if (extName) {
//         return cb(null, true);
//     } else {
//         return cb(new Error('Invalid file type'), false);
//     }
// };

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
});




admin_route.get('/',isLogout,adminController.loadSignin);
admin_route.post('/',adminController.insertSignin);
admin_route.get('/dashboard',isLogin,adminController.loadDashboard);
admin_route.get('/logout',isLogin,adminController.logout);
admin_route.get('/forget',isLogin,adminController.loadforgot);
admin_route.post('/forget',isLogin,adminController.resetOTP);
admin_route.get('/forgot_verify',isLogin,adminController.loadResetVerify);
admin_route.post('/forgot_verify',isLogin,adminController.otpVerify);
admin_route.get('/reset_password',isLogin,adminController.loadResetPassword);
admin_route.post('/reset_password',isLogin,adminController.resetPassword);
admin_route.get('/userList',isLogin,adminController.userList);
admin_route.get('/search',isLogin,adminController.searchUser);
admin_route.get('/editUser',isLogin,adminController.editUserLoad);
admin_route.post('/editUser',isLogin, adminController.updateUser);
admin_route.get('/unblockUser',isLogin,adminController.unBlockUser);
admin_route.get('/blockUser',isLogin,adminController.blockUser);
admin_route.get('/categoriesList',isLogin,categoryController.categoryList);
admin_route.get('/addCategory',isLogin,categoryController.loadaddCategory);
admin_route.post('/addCategory',upload.single('image'),isLogin,categoryController.addCategory);
admin_route.get('/editCategory/:id',isLogin,categoryController.loadEditCategory);
admin_route.post('/editCategory/:id',upload.single('image'),isLogin,categoryController.editCategory);
admin_route.post('/listCategory/:id',isLogin,categoryController.listCategories);
admin_route.post('/unlistCategory/:id',isLogin,categoryController.unlistCategories);
admin_route.get('/productList',isLogin,productController.loadProductList);
admin_route.get('/addProduct',isLogin,productController.loadaddProduct);
admin_route.post('/addProduct',upload.array('images', 5),isLogin, productController.addProduct);
admin_route.get('/editProduct/:id',isLogin,productController.loadEditProduct);
admin_route.get('/deleteImage/:id/:imageIndex',isLogin,productController.deleteImage);
admin_route.post('/editProduct/:id',upload.array('images',5),isLogin,productController.editProduct);
admin_route.post('/listProduct/:id',isLogin, productController.listProduct);
admin_route.post('/unlistProduct/:id',isLogin, productController.unlistProduct);
admin_route.get('/orderList',isLogin,adminController.loadOrderPage);
admin_route.get('/orderDetails/:orderId',isLogin, adminController.loadOrderDetails)
admin_route.post('/changeOrderStatus/:orderId',isLogin,adminController.changeOrderStatus);
admin_route.get('/salesReport',isLogin,orderController.loadSalesReport);
admin_route.get('/couponList',isLogin,couponController.loadCouponList);
admin_route.get('/addCoupon',isLogin,couponController.loadAddCoupon);
admin_route.post('/addCoupon',isLogin,couponController.addCoupon);
admin_route.get('/editCoupon/:couponId',isLogin,couponController.loadEditCoupon);
admin_route.post('/editCoupon/:couponId',isLogin,couponController.editCoupon);
admin_route.get('/deleteCoupon/:couponId',isLogin,couponController.deleteCoupon);
admin_route.get('/bannerList',isLogin,bannerController.loadBanner);
admin_route.get('/addBanner',isLogin,bannerController.loadAddBanner);
admin_route.post('/addBanner',upload.single('image'),isLogin,bannerController.addBanner);
admin_route.get('/editBanner/:bannerId',isLogin,bannerController.loadEditBanner);
admin_route.post('/editBanner/:bannerId',upload.single('image'),isLogin,bannerController.editBanner);
admin_route.post('/enable-banner/:bannerId',isLogin,bannerController.enableBanner);
admin_route.post('/disable-banner/:bannerId',isLogin,bannerController.disableBanner);
admin_route.post('/delete-banner/:bannerId',isLogin,bannerController.deleteBanner);
admin_route.get('/productOfferManagement',isLogin,productController.loadProductOfferManagement);
admin_route.post('/createOffer/:productId',isLogin,productController.createOffer);
admin_route.post('/activateOffer/:productId',isLogin,productController.activateOffer);
admin_route.post('/deactivateOffer/:productId',isLogin,productController.deactivateOffer);
admin_route.get('/deleteOffer/:productId',isLogin,productController.deleteOffer);
admin_route.get('/categoryOfferManagement',isLogin,categoryController.categoryOfferManagement);
admin_route.post('/createCategoryOffer/:categoryId',isLogin,categoryController.createCategoryOffer);
admin_route.post('/activateCategoryOffer/:categoryId',isLogin,categoryController.activateCategoryOffer);
admin_route.post('/deactivateCategoryOffer/:categoryId',isLogin,categoryController.deactivateCategoryOffer);
admin_route.get('/deleteCategoryOffer/:categoryId',isLogin,categoryController.deleteCategoryOffer);


module.exports = admin_route;