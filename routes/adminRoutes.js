const express = require('express');
const admin_route = express.Router();
const session = require('express-session');
const path = require('path');

const configuration = require('../config/configuration');
const {isLogin,isLogout,nocache} = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');


admin_route.use(session({
    secret:configuration.sessionSecret,
    resave:false,
    saveUninitialized:false
}));



admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}));




const multer = require('multer');

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




admin_route.get('/',isLogout,nocache,adminController.loadSignin);
admin_route.post('/',adminController.insertSignin);
admin_route.get('/home',isLogin,nocache,adminController.loadHome);
admin_route.get('/logout',isLogin,nocache,adminController.logout);
admin_route.get('/forget',adminController.loadforgot);
admin_route.post('/forget',adminController.resetOTP);
admin_route.get('/forgot_verify',adminController.loadResetVerify);
admin_route.post('/forgot_verify',adminController.otpVerify);
admin_route.get('/reset_password',adminController.loadResetPassword);
admin_route.post('/reset_password',adminController.resetPassword);
admin_route.get('/userList',adminController.userList);
admin_route.get('/search',adminController.searchUser);
admin_route.get('/editUser',adminController.editUserLoad);
admin_route.post('/editUser', adminController.updateUser);
admin_route.get('/unblockUser',adminController.unBlockUser);
admin_route.get('/blockUser',adminController.blockUser);
admin_route.get('/categoriesList',adminController.categoryList);
admin_route.get('/addData',adminController.createSampleCategories);
admin_route.get('/addCategory',adminController.loadaddCategory);
admin_route.post('/addCategory',upload.single('image'),adminController.addCategory);
admin_route.get('/editCategory/:id',adminController.loadEditCategory);
admin_route.post('/editCategory/:id',upload.single('image'),adminController.editCategory);
admin_route.post('/listCategory/:id',adminController.listCategories);
admin_route.post('/unlistCategory/:id',adminController.unlistCategories);
admin_route.get('/productList',adminController.loadProductList);
admin_route.get('/sampleproducts',adminController.createSampleProducts);
admin_route.get('/addProduct',adminController.loadaddProduct);
admin_route.post('/addProduct',upload.array('images', 5), adminController.addProduct);
admin_route.get('/editProduct/:id',adminController.loadEditProduct);
admin_route.post('/editProduct/:id',upload.array('images',5),adminController.editProduct);
admin_route.post('/listProduct/:id', adminController.listProduct);
admin_route.post('/unlistProduct/:id', adminController.unlistProduct);





module.exports = admin_route;