
const User = require('../models/userModel');
const hashPassword = require('../utlis/hashPassword');
const nodemailer = require('nodemailer');
const { emailUser, emailPassword } = require('../config/configuration');
const bcrypt = require('bcrypt');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');




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

const loadsignup = async (req, res) => {
  try {

    const menCategories = await getCategoryiesByType('Men');
    const womenCategories = await getCategoryiesByType('Women');
    const kidsCategories = await getCategoryiesByType('Kids');
    const beautyCategories = await getCategoryiesByType('Beauty');

    const userID = req.session.user_id || null;
    const message = { welcome: 'Welcome! Please sign up to create an account' };

    res.render('signup', { menCategories, womenCategories, kidsCategories, beautyCategories, userID, message });
  } catch (error) {
    console.log(error);
  }
}

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: emailUser,
    pass: emailPassword
  }
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}


const sendOTPByEmail = async (email, OTP) => {

  try {
    const mailOptions = {
      from: emailUser,
      to: email,
      subject: 'Your OTP for Registration',
      text: `Your OTP for registration is: ${OTP}`
    };

    const sendMailResult = await transporter.sendMail(mailOptions);
    console.log('Email sent with OTP Successfully.');

  } catch (error) {
    console.log('Error sending email:', error);
    throw new Error('Error sending email');
  }
};
//usersignup

const userSignup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    //render the templates

    const userID = req.session.user_id || null;
    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });




    const nameRegex = /^(?! )[A-Za-z\s]+(?! )$/;
    const emailRegex = /^\S+@\S+\.\S+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+]{8,}$/;
    const phoneRegex = /^\d{10}$/;

    if (!nameRegex.test(name)) {
      return res.render('signup', { message: { name: 'Please enter a valid name' }, menCategories, womenCategories, kidsCategories, beautyCategories, userID });
    }

    if (!emailRegex.test(email)) {
      return res.render('signup', { message: { email: 'Please Enter a valid Email' }, menCategories, womenCategories, kidsCategories, beautyCategories, userID })
    }
    if (!passwordRegex.test(password)) {
      return res.render('signup', { message: { password: 'Please enter a valid password' }, menCategories, womenCategories, kidsCategories, beautyCategories, userID })
    }
    if (!phoneRegex.test(phone)) {
      return res.render('signup', { message: { phone: 'Please enter valid 10 digit phone number' }, menCategories, womenCategories, kidsCategories, beautyCategories, userID })
    }
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.render('signup', { message: { email: 'Email already exist . Kindly Log In ' }, menCategories, womenCategories, kidsCategories, beautyCategories, userID });
    }

    const generatedOTP = generateOTP();



    req.session.userData = {
      name,
      email,
      password,
      phone,
      isadmin: 0,
      OTP: generatedOTP,
    };

    await sendOTPByEmail(email, generatedOTP);

    res.redirect('/verify');

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};



const getVerify = async (req, res) => {
  try {

    let message = ''

    const userID = req.session.user_id || null;
    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

    res.render('verify', { message, menCategories, womenCategories, kidsCategories, beautyCategories, userID });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//verify otp

const verifyOTP = async (req, res) => {
  try {

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });
    const userID = req.session.user_id || null;
    let message = ''


    const { email, enteredOTP } = req.body;

    const userData = req.session.userData;

    console.log('Entered OTP:', enteredOTP);
    console.log('Stored OTP:', userData.OTP);

    const cleanEnteredOTP = String(enteredOTP).trim(); // Convert to string and trim
    const cleanStoredOTP = String(userData.OTP).trim();

    if (cleanStoredOTP === cleanEnteredOTP) {
      const hashedPassword = await hashPassword(userData.password);

      const newUser = new User({
        name: userData.name,
        email: userData.email,
        isadmin: userData.is_admin,
        phone: userData.phone,
        password: hashedPassword,
        joinedDate: new Date(),
      });

      await newUser.save();

      req.session.userData = null;

      res.redirect('/');
    } else {
      res.status(400).render('verify', { message: 'Invalid OTP. Please Try Again', menCategories, womenCategories, kidsCategories, beautyCategories, userID, message });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//resend OTP

const resendOTP = async (req, res) => {
  try {

    const newOTP = generateOTP();

    console.log(newOTP);

    const email = req.session.userData.email;

    console.log(email);

    req.session.userData.OTP = newOTP;

    await sendOTPByEmail(email, newOTP);
    res.status(200).send('OTP resent successfully');

  } catch (error) {
    console.log(error.message);
  }
}

//load the login

const loadlogin = async (req, res) => {
  try {
    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

    const userID = req.session.user_id || null;

    const message = { welcome: 'Welcome! Please Sign In to the account' };

    if (req.query.isBlocked) {
      message = { error: 'Your account has been blocked by the admin. Please sign in with a new account.' };
    }

    res.render('login', { message, userID, menCategories, womenCategories, kidsCategories, beautyCategories });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: 'Cannot load Login page' });
  }
}

//user logins

const loginUser = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    console.log('Entered Email:', email);
    console.log('Entered Password:', password);

    const userID = req.session.user_id || null;

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });




    const userData = await User.findOne({ email: email });
    console.log('UserData :', userData);

    const message = { welcome: 'Email and password is incorrect' };
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      console.log('Password Match :', passwordMatch);
      if (passwordMatch) {

        req.session.user_id = userData._id;
        res.redirect('/home');

      }

      else {
        res.render('login', { message, userID, menCategories, womenCategories, kidsCategories, beautyCategories });
        console.log('Email and password is incorrect');
      }

    }
    else {
      res.render('login', { message, userID, menCategories, womenCategories, kidsCategories, beautyCategories });
      console.log('Email and password is incorrect');
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Cannot login' });
  }
}

//load home page

const loadHome = async (req, res) => {
  try {
    let message = '';

    if (req.session.user_id) {
      const userData = await User.findById({ _id: req.session.user_id });
      if (userData) {
        if (userData.isblocked === true) {
          message = 'Your account has been blocked by the admin. Please sign up with a new account.';
          return res.redirect('/blockedUser');
        }

        // Fetch menCategories
        const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
        const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
        const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
        const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

        // Render the home page with userData, userID, message, and menCategories
        message = `Welcome back, ${userData.name}!`; // Welcome back message for logged-in users
        return res.render('home', { user: userData, userID: req.session.user_id, message, menCategories, womenCategories, kidsCategories, beautyCategories });
      }
    } else {
      message = 'Please log in to continue.'; // Prompt to log in for non-logged-in users
      res.redirect('/');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Failed to load Home Page' });
    res.redirect('/');
  }
};

// page to render the blocked user

const blockedUser = async (req, res) => {
  try {
    const userID = req.session.user_id || null;

    const userData = await User.findById(userID);

    if (userData && userData.isblocked) {
      let message = 'Your Account has been Blocked by the admin. Kindly Sign up with a different Account.';
      const menCategories = await Category.find({ categoryType: 'Men', isBlocked: false });
      const womenCategories = await Category.find({ categoryType: 'Women', isBlocked: false });
      const kidsCategories = await Category.find({ categoryType: 'Kids', isBlocked: false });
      const beautyCategories = await Category.find({ categoryType: 'Beauty', isBlocked: false });

      // Destroy the user's session

      res.render('blockedUser', { userID, userData, message, menCategories, womenCategories, kidsCategories, beautyCategories });

    } else {
      res.redirect('/home');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Failed to load Blocked User Page' });
  }
};




//logout page

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/');
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Error' })
  }
}

//load forget password page

const loadforgot = async (req, res) => {
  try {

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

    const userID = req.session.user_id || null;

    let message = '';

    res.render('forget', { message, menCategories, womenCategories, kidsCategories, beautyCategories, userID });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Cannot Load the reset page' })
  }
}

//Entering the reset email and send otp for verification 

const resetOTP = async (req, res) => {
  try {

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

    const userID = req.session.user_id || null;

    let message = '';


    const email = req.body.email;
    if (!email) {
      return res.status(400).render('forget', { message, menCategories, womenCategories, kidsCategories, beautyCategories, userID })
    }

    const generatedOTP = generateOTP();

    req.session.userData = {
      email,
      OTP: generatedOTP
    };

    await sendOTPByEmail(email, generatedOTP);

    res.redirect('/forgot_verify');


  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Cannot send OTP' })

  }
}

// Render the Reset password verification page

const loadResetVerify = async (req, res) => {
  try {

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

    const userID = req.session.user_id || null;

    let message = '';

    res.render('forgot_verify', { menCategories, womenCategories, kidsCategories, beautyCategories, message, userID });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Cannot load Verification page' })
  }
}

// reset otp verification

const otpVerify = async (req, res) => {
  try {
    const { email, enteredOTP } = req.body;


    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

    const userID = req.session.user_id || null;

    let message = '';



    const storedOTP = req.session.userData.OTP;
    if (!storedOTP) {
      res.render('forget_verify', menCategories, womenCategories, kidsCategories, beautyCategories, userID, message)
    }

    console.log("Entered OTP:", enteredOTP);
    console.log("Stored OTP:", storedOTP);

    const cleanedEnteredOTP = String(enteredOTP).trim();
    const cleanedStoredOTP = String(storedOTP).trim();

    if (cleanedStoredOTP === cleanedEnteredOTP) {

      res.redirect('/reset_password');
    } else {

      res.status(400).render('forget_verify', { message: 'Invalid OTP. Please try again ' });

    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal Server Error' })
    res.render('forgot_verify');
  }
}

const loadResetPassword = async (req, res) => {
  try {

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

    const userID = req.session.user_id || null;

    let message = '';
    res.render('reset_password', { message, menCategories, womenCategories, kidsCategories, beautyCategories, userID });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Cannot load Reset password page' })
  }
}


const resetPassword = async (req, res) => {
  try {

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

    const userID = req.session.user_id || null;

    let message = '';



    const { new_password, confirm_password } = req.body;
    if (new_password !== confirm_password) {
      return res.status(400).render('reset_password', { message: 'Password are not same', menCategories, womenCategories, kidsCategories, beautyCategories, userID });
    }


    console.log(req.session.userData)

    const { email } = req.session.userData;

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await hashPassword(new_password);

    user.password = hashedPassword;

    await user.save();

    req.session.userData = null;

    res.redirect('/')

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Invalid Session Error' });
  }
}



const loadCheckoutPage = async (req, res) => {
  try {
    let itemsInCart = [];
    const userID = req.session.user_id;
    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });
    let message = '';

    const userCart = await Cart.findOne({ user: userID }).populate('items.product');

    if (!userCart || userCart.items.length === 0) {
      console.log('No items in the cart.');
      return res.render('cart', { menCategories, womenCategories, beautyCategories, kidsCategories, userID, message, itemsInCart, productTotal });
    }

    const user = await User.findById(userID).exec();
    const userAddresses = user ? user.addresses : [];

    const Addresses = userAddresses.map((address, index) => ({
      ...address.toObject(),
      index,
    }));

    itemsInCart = userCart ? userCart.items : [];
    console.log('Items in cart:', itemsInCart);

    const totalPriceOfCart = userCart.totalPrice;
    console.log('Total price of cart:', totalPriceOfCart);

    const productTotal = itemsInCart.map((cartItem) => {
      if (cartItem.product && cartItem.product.price) {
        const total = cartItem.product.price * cartItem.quantity;
        return total;
      } else {
        return 0;
      }
    });

    res.render('checkout', { message, userID, menCategories, womenCategories, kidsCategories, beautyCategories, Addresses, itemsInCart, totalPriceOfCart, productTotal });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Invalid Session Error' })
  }
}

const loadAddAddress = async (req, res) => {
  try {
    const userID = req.session.user_id;
    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });
    let message = '';
    res.render('addAddress', { userID, menCategories, womenCategories, kidsCategories, beautyCategories, message });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Invalid Error Session' })
  }
}


const saveAddress = async (req, res) => {
  try {
    const userID = req.session.user_id;
    const { fullName, country, addressLine, locality, city, state, pinCode, phone } = req.body;

    const user = await User.findById(userID);
    if (!user) {
      return res.status(500).json({ message: 'User not found' });
    }

    user.addresses.push({
      fullName,
      country,
      addressLine,
      locality,
      city,
      state,
      pinCode,
      phone
    })

    await user.save();
    res.status(200).json({ status: 'success', message: 'Address successfully updated.' })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Invalid Session Error' })
  }
}


const removeAddress = async (req, res) => {
  try {
    const addressId = req.body.addressId;

    const userID = req.session.user_id;

    const user = await User.findById(userID)
    console.log(user);

    if (!user || !user.addresses) {
      return res.status(404).json({ error: 'User not found or addresses not available. ' })
    }

    user.addresses = user.addresses.filter(address => address._id.toString() !== addressId);

    await user.save();

    res.status(200).json({ status: 'success', message: 'Address successfully removed.' })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ error: 'Invalid Session Error' });
  }
}

const getAddressDetails = async (req, res) => {
  try {
    const addressId = req.params.addressId;

    const user = await User.findOne({ 'addresses._id': addressId });

    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'Address not found' });
    }

    const address = user.addresses.find(address => address._id.toString() === addressId);

    if (!address) {
      return res.status(404).json({ status: 'fail', message: 'Address not found' });
    }

    res.status(200).json({ status: 'success', address });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Invalid Server Error' });
  }
}


const updateAddress = async (req, res) => {
  try {
    const formData = req.body;
    const userID = req.session.user_id;
    const user = await User.findOne({ 'addresses._id': formData.addressId });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Address not found' });
    }

    const addressIndex = user.addresses.findIndex(address => address._id.toString() === formData.addressId);

    if (addressIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Address not found' });
    }

    const updateAddress = user.addresses[addressIndex];
    updateAddress.fullName = formData.fullName;
    updateAddress.country = formData.country;
    updateAddress.addressLine = formData.addressLine;
    updateAddress.locality = formData.locality;
    updateAddress.city = formData.city;
    updateAddress.state = formData.state;
    updateAddress.pinCode = formData.pinCode;
    updateAddress.phone = formData.phone;

    await user.save();

    res.status(200).json({ status: 'success', message: 'Address successfully updated.' })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
}


const loadUserAccount = async (req, res) => {
  try {
    const userID = req.session.user_id;
    let message = '';

    const user = await User.findById(userID);
    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'beauty', isDeleted: false });
    let title = 'Account';

    res.render('myAccount', { menCategories, womenCategories, kidsCategories, beautyCategories, message, userID, user, title });
  } catch (error) {
    console.log(error.message);
  }
}

const editMyAccount = async (req, res) => {
  try {

    const { name, phone } = req.body;
    console.log(req.body);
    const userID = req.session.user_id;
    const user = await User.findByIdAndUpdate(userID, { $set: { name: name, phone: phone } }, { new: true });
    res.json({ success: true, user });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Invalid Error Session ' })
  }
}

const loadEditMyAccount = async (req, res) => {
  try {
    const userID = req.session.user_id;
    let message = '';

    const user = await User.findById(userID);
    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'beauty', isDeleted: false });


    res.render('editMyAccount', { menCategories, womenCategories, kidsCategories, beautyCategories, message, userID, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Invalid Error Session' });
  }
}

const loadMyAddress = async (req, res) => {
  try {

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'beauty', isDeleted: false });

    let message = '';
    const userID = req.session.user_id;
    const user = await User.findById(userID);
    const userAddresses = user ? user.addresses : [];

    const Addresses = userAddresses.map((address, index) => ({
      ...address.toObject(),
      index,
    }));

    const title = 'Address'

    res.render('myAddress', { user, userID, message, menCategories, womenCategories, kidsCategories, beautyCategories, Addresses, title });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Invalid Session Error' });
  }
}

const loadMyOrders = async (req, res) => {
  try {
    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'beauty', isDeleted: false });

    let message = '';
    const userID = req.session.user_id;
    const user = await User.findById(userID);
    const title = 'Orders'
    const orderInfo = await Order.find({ user: userID }).sort({ orderDate: -1 })
    res.render('myOrders', { menCategories, womenCategories, kidsCategories, beautyCategories, message, user, userID, title, orderInfo })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Invalid Session Error' });
  }
}

const loadMyPassword = async (req, res) => {
  try {

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'beauty', isDeleted: false });
    let message = '';
    const userID = req.session.user_id;
    const user = await User.findById(userID);
    const title = 'Settings'
    res.render('myPassword', { userID, user, menCategories, womenCategories, kidsCategories, beautyCategories, title, message });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Invalid Session Error' });
  }
}

const editMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    console.log('Current Password:', currentPassword);
    console.log('New Password:', newPassword);
    console.log('Confirm Password:', confirmPassword);
    const userID = req.session.user_id;
    const user = await User.findById(userID);

    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
    console.log('isPasswordMatch', isPasswordMatch)

    if (!isPasswordMatch) {
      return res.status(400).json({ status: 'error', message: 'Current Password is incorrect' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ status: 'error', message: 'New Password and confirm Password do not Match' })
    }

    const hashedPassword = await hashPassword(newPassword);
    console.log("hashedPassword:", hashedPassword)


    user.password = hashedPassword;
    console.log('UserPassword: ', user.password);
    await user.save();

    res.json({ status: 'success', message: 'Password updated successfully' });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Invalid Session Error' })
  }
}

const loadOrderedItems = async (req, res) => {
  try {
    const userID = req.session.user_id;
    const user = await User.findById(userID);
    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'beauty', isDeleted: false });
    let message = '';

    const orderId = req.params.orderId;
    const orderInfo = await Order.findById(orderId).populate('items.product');
    console.log(orderInfo);

    const title = 'Orders';

    if (!orderInfo) {
      return res.status(404).json({ message: 'Order not found' });
    }


    // Check if orderInfo is an array before rendering the view
    const orderInfoArray = Array.isArray(orderInfo) ? orderInfo : [orderInfo];

    res.render('orderItems', { userID, user, menCategories, womenCategories, kidsCategories, beautyCategories, message, orderId, orderInfo, title, orderInfo: orderInfoArray });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Invalid Session Error' });
  }
}

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'cancelled') {
      order.orderStatus = 'cancelled';

      await order.save();

      return res.redirect(`/orderItems/${orderId}`);
    } else {
      return res.status(400).json({ message: 'Order is already Cancelled' });
    }
  } catch (error) {
    console.log(error.message);
    re.status(500).json('Invalid Session Error')
  }
}



const cancelProductInOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const index = parseInt(req.params.index);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }


    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ status: 'error', message: 'Order is already cancelled' });
    }

    // Check if the index is valid
    if (index < 0 || index >= order.items.length) {
      return res.status(400).json({ status: 'error', message: 'Invalid product index' });
    }


    console.log('Order ID:', orderId);
    console.log('Product Index:', index);
    console.log('Order Items:', order.items);


    const canceledProduct = order.items[index];
    const canceledProductValue = canceledProduct.price * canceledProduct.quantity;

    // Use $pull to remove the product from the order's items array based on the index
    order.items.pull({ _id: canceledProduct._id });

    // Update the total price of the order
    order.totalPrice -= canceledProductValue;

    // Save the updated order
    await order.save();

    return res.redirect(`/orderItems/${orderId}`);
  } catch (error) {
    console.error('Error cancelling product:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to cancel product' });
  }
};






module.exports = {
  loadsignup,
  userSignup,
  getVerify,
  verifyOTP,
  resendOTP,
  loadlogin,
  loginUser,
  loadHome,
  logout,
  loadforgot,
  resetOTP,
  loadResetVerify,
  otpVerify,
  loadResetPassword,
  resetPassword,
  loadUserAccount,
  blockedUser,
  loadCheckoutPage,
  loadAddAddress,
  saveAddress,
  removeAddress,
  getAddressDetails,
  updateAddress,
  editMyAccount,
  loadEditMyAccount,
  loadMyAddress,
  loadMyOrders,
  loadMyPassword,
  editMyPassword,
  loadOrderedItems,
  cancelOrder,
  cancelProductInOrder
}










