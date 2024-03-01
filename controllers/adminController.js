const User = require('../models/userModel');
const hashPassword = require('../utlis/hashPassword');
const bcrypt = require('bcrypt');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const nodemailer = require('nodemailer');
const Order = require('../models/orderModel');
const { emailUser, emailPassword } = require('../config/configuration');
const { name } = require('ejs');




const loadSignin = async (req, res) => {
  try {
    const message = 'Welcome to Admin Login'
    res.render('adminLogin', { message });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Cannot Load Login page' });
  }
}

// login with admin details

const insertSignin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    console.log("Entered Email :", email);
    console.log("Entered password :", password);

    const userData = await User.findOne({ email: email });

    console.log('UserData :', userData);

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.isadmin === 0) {
          res.render('adminLogin', { message: 'You are not authorized to access the admin panel.' });
        } else {
          req.session.user_id = userData._id;
          res.redirect('/admin/dashboard');
        }
      } else {
        res.render('adminLogin', { message: 'Incorrect email or password. Please try again.' });
      }
    } else {
      res.render('adminLogin', { message: 'Incorrect email or password. Please try again.' });
    }
  } catch (error) {
    console.log(error.message);
  }
}




const loadDashboard = async (req, res) => {
  try {
    let message = '';
    const salesData = await Order.find()
      .populate('user', 'name')
      .sort({ orderDate: -1 });

    const products = await Product.find();
    const categories = await Category.find();
    const users = await User.find();

    // Fetch and sort orders by the latest order date
    const order = await Order.find().populate('user', 'name').sort({ orderDate: -1 }).limit(5);

    const codNum = await Order.countDocuments({ 'payments.pay_method': 'COD' });
    const onlineNum = await Order.countDocuments({ 'payments.pay_method': 'onlinePayment' });
    const walletNum = await Order.countDocuments({'payments.pay_method':'Wallet'});
    const paid = await Order.countDocuments({ 'orderStatus': 'placed', 'payments.pay_status': 'success' });
    const paymentPending = await Order.countDocuments({ 'orderStatus': 'placed', 'payments.pay_status': 'pending' });
    const cancelledOrders = await Order.countDocuments({ 'orderStatus': 'cancelled' });
    const pendingOrders = await Order.countDocuments({ 'orderStatus': 'pending' });

    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

   
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); 

    
    let salesChartDt = await Order.aggregate([
      {
        $match: {
          orderStatus: 'placed',
          orderDate: { $gte: startOfWeek, $lte: endOfWeek }
        }
      },
      {
        $group: {
          _id: { day: { $dayOfWeek: "$orderDate" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    
    let SalesCount = Array.from({ length: 7 }, (_, index) => ({
      _id: { day: index + 1 },
      count: 0
    }));

    
    salesChartDt.forEach((data) => {
      SalesCount[data._id.day - 1].count = data.count;
    });

    res.render('adminHome', {
      title: 'Admin Panel',
      page: 'Dashboard',
      message,
      order,
      salesData,
      products,
      categories,
      users,
      codNum,
      onlineNum,
      walletNum,
      paid,
      paymentPending,
      cancelledOrders,
      pendingOrders,
      SalesCount,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Invalid Session Error' });
  }
};




const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/admin');
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'An Error has Occured' })
  }
}


//load forget password page:

const loadforgot = async (req, res) => {
  try {
    let message = ''
    res.render('adminForget', { message });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Cannot Load the reset page' })
  }
}

// create a transporter

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: emailUser,
    pass: emailPassword
  }
});



// function to define genrate otp:
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000)
}

// sending OTP by email;

const sendOTPByEmail = async (email, OTP) => {
  try {
    const mailOptions = {
      from: emailUser,
      to: email,
      subject: 'You OTP for Reseting Password',
      text: `Your OTP for Reset is ${OTP}`
    };
    const sendMailResult = await transporter.sendMail(mailOptions);
    console.log('Email sent with OTP Successfully');

  } catch (error) {
    console.log(error.message);
  }
}

//Entering the reset email and send otp for verification 

const resetOTP = async (req, res) => {
  try {
    const email = req.body.email;


    const generatedOTP = generateOTP();

    req.session.userData = {
      email,
      OTP: generatedOTP
    };


    console.log(req.session.userData);

    await sendOTPByEmail(email, generatedOTP);

    res.redirect('/admin/forgot_verify');

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Cannot send OTP' })

  }
}

// Render the Reset password verification page

const loadResetVerify = async (req, res) => {
  try {
    let message = ''
    res.render('adminForgot_verify', { message });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Cannot load Verification page' })
  }
}

// reset otp verification

const otpVerify = async (req, res) => {
  try {
    console.log(req.body);
    const { email, enteredOTP } = req.body;

    const userData = req.session.userData;

    console.log("Entered OTP:", enteredOTP);
    console.log("Stored OTP:", userData.OTP);

    const cleanedEnteredOTP = String(enteredOTP).trim();
    const cleanedStoredOTP = String(userData.OTP).trim();

    if (cleanedStoredOTP === cleanedEnteredOTP) {

      res.redirect('/admin/reset_password');
    } else {
      let message = 'Entered OTP is Invalid. Kindly reenter the OTP'
      res.status(400).render('adminForgot_verify', { message });

    }
  } catch (error) {
    console.log(error.message);
    let message = "Invalid Server Error"
    res.status(500).render('adminForgot_verify', { message });
  }
}

//Load the reset password page

const loadResetPassword = async (req, res) => {
  try {
    let message = ''
    res.render('adminReset_password', { message });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Cannot load Reset password page' })
  }
}


const resetPassword = async (req, res) => {
  try {

    const { new_password, confirm_password } = req.body;
    if (new_password !== confirm_password) {
      return res.status(400).render('adminReset_password', { message: 'Password are not same' });
    }

    const { email } = req.session.userData;


    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await hashPassword(new_password);

    user.password = hashedPassword;

    await user.save();

    req.session.userData = null;

    res.redirect('/admin')

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Invalid Session Error' });
  }
}

//load userList

const userList = async (req, res) => {
  try {
    let message = '';
    const userData = await User.find({ isadmin: 0 });
    console.log(userData);
    res.render('userList', { users: userData, message });
  } catch (error) {
    console.log(error.message);
  }
};


const searchUser = async (req, res) => {
  try {
    const query = req.query.query;
    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        },
        { isadmin: { $ne: 1 } },

      ],

    });
    res.render('userList', { users: users });
  } catch (error) {
    console.log(error.message);
  }
}

const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });

    if (userData) {
      res.render('editUser', { user: userData });
    }
    else {
      res.redirect('/admin/userList');
    }
  } catch (error) {
    console.log(error.message);
  }
}

const updateUser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate({ _id: req.body._id }, { $set: { name: req.body.name, email: req.body.email, phone: req.body.phone } });
    res.redirect('/admin/userList');
  } catch (error) {
    console.log(error.message)
  }
}

//block the user

const blockUser = async (req, res) => {
  try {
    const userId = req.query.id;
    await User.findByIdAndUpdate(userId, { isblocked: true });
    res.redirect('/admin/userList');
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/userList');
  }
};

//unblock user

const unBlockUser = async (req, res) => {
  try {
    const userId = req.query.id;
    await User.findByIdAndUpdate(userId, { isblocked: false });
    res.redirect('/admin/userList');
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/userList');
  }
};


// order management 

const loadOrderPage = async (req, res) => {
  try {
    let message = '';

    const orders = await Order.find().sort({ orderDate: -1 }).populate('user');
    if (orders.length === 0) {
      return res.status(500).json({ message: 'Order not found' });
    }

    res.render('orderManagement', { order: orders, message });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Invalid Session Error' });
  }
}


const loadOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    let message = '';

    const order = await Order.findById(orderId).populate('user').populate({
      path: 'items.product',
      model: 'product'
    }).exec();


    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Order Info:', order);

    res.render('orderDetails', { message, orderInfo: order });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Invalid Session Error' });
  }
}


const changeOrderStatus = async (req, res) => {
  try {

    const orderId = req.params.orderId;
    const newStatus = req.body.orderStatus;

    const updatedOrder = await Order.findByIdAndUpdate(orderId, { orderStatus: newStatus }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.redirect('/admin/orderDetails/' + orderId);

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Invalid Session Error' });
  }
}



module.exports = {
  loadSignin,
  insertSignin,
  logout,
  loadforgot,
  resetOTP,
  loadResetVerify,
  otpVerify,
  loadResetPassword,
  resetPassword,
  loadDashboard,
  userList,
  searchUser,
  editUserLoad,
  updateUser,
  blockUser,
  unBlockUser,
  loadOrderPage,
  loadOrderDetails,
  changeOrderStatus
}