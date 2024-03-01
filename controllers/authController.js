
const User = require('../models/userModel');
const hashPassword = require('../utlis/hashPassword');
const nodemailer = require('nodemailer');
const { emailUser, emailPassword } = require('../config/configuration');
const bcrypt = require('bcrypt');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Banner = require('../models/bannerModel');

const { KEY_ID, KEY_SECRET } = process.env;
const Razorpay = require('razorpay');
const rzp = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
  }
};

const generateReferralCode = (name, phone) => {
  const namePrefix = name.substring(0, 5).toUpperCase();
  const phoneSuffix = phone.toString().slice(-3);
  const referralCode = `${namePrefix}${phoneSuffix}`;
  return referralCode;
};


//usersignup

const userSignup = async (req, res) => {
  try {
    const { name, email, password, phone,referralCode } = req.body;

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



    req.session.referralCode = referralCode;


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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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

    const { email, enteredOTP } = req.body;
    const userData = req.session.userData;

    const cleanEnteredOTP = String(enteredOTP).trim();
    const cleanStoredOTP = String(userData.OTP).trim();

    if (cleanStoredOTP === cleanEnteredOTP) {
      const hashedPassword = await hashPassword(userData.password);
      const referralCode = generateReferralCode(userData.name, userData.phone);

      const newUser = new User({
        name: userData.name,
        email: userData.email,
        isadmin: userData.is_admin,
        phone: userData.phone,
        password: hashedPassword,
        referral: {
          code: referralCode,
        },
        joinedDate: new Date(),
      });

      if (req.session.referralCode) {
        const referrer = await User.findOne({ 'referral.code': req.session.referralCode });

        if (referrer) {
          const referralAmountToAdd = 300;
          const newUserAmountToAdd = 200;
          referrer.wallet += referralAmountToAdd;
          referrer.referral.amount += referralAmountToAdd;
          newUser.wallet += newUserAmountToAdd;  
          newUser.referral.amount += newUserAmountToAdd;
          await referrer.save();
        }
        delete req.session.referralCode;
      }

      await newUser.save();
      req.session.userData = null;
      res.redirect('/');
    } else {
      res.status(400).render('verify', { message: 'Invalid OTP. Please Try Again', menCategories, womenCategories, kidsCategories, beautyCategories, userID });
    }
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
  }
}


//load home page

const loadHome = async (req, res) => {
  try {
    let message = '';

    if (req.session.user_id) {
      const userData = await User.findById(req.session.user_id);
      if (userData) {
        if (userData.isblocked === true) {
          message = 'Your account has been blocked by the admin. Please sign up with a new account.';
          return res.redirect('/blockedUser');
        }

        // Fetch categories
        const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
        const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
        const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
        const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

        const latestProducts = await Product.find({ isDeleted: false })
          .sort({ dateCreated: -1 }) // Sort by creation date in descending order
          .limit(4); // Limit the results to the latest 4 products

        message = `Welcome back, ${userData.name}!`;
        return res.render('home', {
          user: userData,
          latestProducts,
          userID: req.session.user_id,
          message,
          menCategories,
          womenCategories,
          kidsCategories,
          beautyCategories
        });
      }
    } else {
      message = 'Please log in to continue.';
      return res.redirect('/');
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
  }
};


//logout page

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');

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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
  }
}


const loadCheckoutPage = async (req, res) => {
  try {
    const userID = req.session.user_id;
    console.log('userID:',userID);
    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });
    let message = req.session.message || '';

    req.session.message = null;

    const userCart = await Cart.findOne({ user: userID }).populate('items.product');

    const subTotal = userCart.totalPrice;

    if (!userCart || userCart.items.length === 0) {
      console.log('No items in the cart.');
      return res.render('cart', { menCategories, womenCategories, beautyCategories, kidsCategories, userID, message, itemsInCart: [], productTotal: [], req: req });
    }

    const userDetails = await User.findById(userID);
    const userAddresses = userDetails ? userDetails.addresses : [];

    const Addresses = userAddresses.map((address, index) => ({
      ...address.toObject(),
      index,
    }));

    // Check stock availability for each item in the cart
    const stockAvailability = userCart.items.every(cartItem => {
      const product = cartItem.product;
      const requestedQuantity = cartItem.quantity;
      const size = cartItem.size;
      const selectedSize = product.sizes.find(s => s.size === size);
      return selectedSize && selectedSize.stock >= requestedQuantity;
    });

    if (!stockAvailability) {
      req.session.message = {
        type: 'danger',
        message: 'Some products in your cart are out of stock or insufficient stock.',
        fromRedirect: true,
      };
      return res.redirect('/cart');
    }

    const itemsInCart = userCart.items;
    const totalPriceOfCart = userCart.totalPrice;

    const productTotal = itemsInCart.map((cartItem) => {
      if (cartItem.product && cartItem.product.price) {
        return cartItem.product.price * cartItem.quantity;
      } else {
        return 0;
      }
    });
    

    const couponDetails = req.session.couponDetails || null;
    let totalPriceAfterDiscount = totalPriceOfCart;
    if (couponDetails) {
      totalPriceAfterDiscount -= couponDetails.discount || 0;
    }

    const userWalletBalance = userDetails.wallet || 0; // Accessing wallet from userDetails

    res.render('checkout', { message, userID, menCategories, womenCategories, kidsCategories, beautyCategories, Addresses, itemsInCart, subTotal, productTotal, totalPriceOfCart, req: req, couponDetails, userDetails, userWalletBalance, totalPriceAfterDiscount });
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};






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
    console.error(error);
    res.status(500).render('404');
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
    });

    await user.save();
    res.redirect('/checkout');
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};





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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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

    // Update the address fields
    user.addresses[addressIndex].fullName = formData.fullName;
    user.addresses[addressIndex].country = formData.country;
    user.addresses[addressIndex].addressLine = formData.addressLine;
    user.addresses[addressIndex].locality = formData.locality;
    user.addresses[addressIndex].city = formData.city;
    user.addresses[addressIndex].state = formData.state;
    user.addresses[addressIndex].pinCode = formData.pinCode;
    user.addresses[addressIndex].phone = formData.phone;

    // Save the updated user object
    await user.save();

    // Redirect to the checkout page after successful update
    res.redirect('/checkout');
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};


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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
  }
}

const loadMyWallet = async(req,res)=>{
  try {
    const menCategories = await getCategoryiesByType('Men');
    const womenCategories = await getCategoryiesByType('Women');
    const kidsCategories = await getCategoryiesByType('Kids');
    const beautyCategories = await getCategoryiesByType('Beauty');

    let message = '';
    const userID = req.session.user_id;
    const user = await User.findById(userID);
    const transactions = user.transaction

    const title = 'Wallet'

    res.render('myWallet',{menCategories,womenCategories,kidsCategories,beautyCategories,message,userID,title,user})
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
}

const addtowallet = async (req, res) => {
  try {
    const amount = req.body.amount * 100;

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: 'order_receipt',
    };

    const order = await rzp.orders.create(options);

   

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};


const razorpaySuccess = async (req, res) => {
  try {
    const paymentId = req.body.response.razorpay_payment_id;
    const orderId = req.body.response.razorpay_order_id;
    const signature = req.body.response.razorpay_signature;

    const generateSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generateSignature !== signature) {
      return res.status(403).json({ error: 'Invalid Razorpay signature' });
    }

    const userId = req.session.user_id;
    const amount = req.body.order.amount / 100; // Multiply by 100 to convert back to rupees

    const user = await User.findById(userId);

    user.wallet += amount;

    const transaction = {
      description:'Amount credited to wallet',
      amount:amount,
    }

    user.transactions.push(transaction);

    await user.save();

    res.json({ status: 'success' });
  } catch (error) {
    cconsole.error(error);
    res.status(500).render('404');
  }
};



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

    const orderInfoArray = Array.isArray(orderInfo) ? orderInfo : [orderInfo];

    res.render('orderItems', { userID, user, menCategories, womenCategories, kidsCategories, beautyCategories, message, orderId, orderInfo, title, orderInfo: orderInfoArray });

  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
}

const moment = require('moment');
const PDFDocument = require('pdfkit'); 
const PdfPrinter = require('pdfmake'); 


const generateInvoicePDF = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const orderInfo = await Order.findById(orderId).populate('items.product');
    const user = await User.findById(req.session.user_id);

    if (!orderInfo || !user || !user.addresses || user.addresses.length === 0) {
      return res.status(404).json({ message: 'Order, user, or user addresses not found or incomplete' });
    }

    // Assuming only one address is used for the invoice
    const userAddress = user.addresses[0];

    // Calculate total price, discount amount, and grand total from the order
    const totalPrice = orderInfo.totalPrice || 0;
    const discountAmount = orderInfo.discount_amount || 0;
    const grandTotal = orderInfo.grand_total || 0;

    const docDefinition = {
      content: [
        {
          columns: [
            // Company Name and Address
            [
              { text: 'Conclave - The Fashion Store', style: 'companyName' },
              { text: '123, ABC Building, XYZ Road, Near Example Chowk', style: 'address' },
              { text: 'Mumbai, Maharashtra, India - 400001', style: 'address' },
            ],
            // Spacer
            ''
          ],
          margin: [0, 0, 0, 20], // Adjust the margin as needed
        },
        { text: 'Invoice', style: 'header' },
        {
          columns: [
            [
              { text: 'Customer Name:', style: 'subheader' },
              { text: 'Order ID:', style: 'subheader' },
              { text: 'Order Date:', style: 'subheader' },
              { text: 'Bill Address:', style: 'subheader' }
            ],
            [
              { text: user.name, style: 'subheaderValue' },
              { text: orderInfo.orderID, style: 'subheaderValue' },
              { text: moment(orderInfo.orderDate).format('DD-MM-YYYY'), style: 'subheaderValue' },
              { text: `${userAddress.fullName}, ${userAddress.addressLine}, ${userAddress.city}, ${userAddress.state}, ${userAddress.pinCode}`, style: 'subheaderValue' }
            ]
          ]
        },
        { text: 'Order Details:', style: 'subheader' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: [
              [
                { text: 'Product Name', style: 'tableHeader' },
                { text: 'Quantity', style: 'tableHeader' },
                { text: 'Price', style: 'tableHeader' }
              ],
              ...(orderInfo.items.map(item => [
                { text: item.product ? item.product.name : '', style: 'tableCell' },
                { text: item.quantity ? item.quantity.toString() : '', style: 'tableCell' },
                { text: item.price ? item.price.toString() : '', style: 'tableCell' }
              ]))
            ]
          }
        },
        { text: `Total Amount: ${totalPrice}`, style: 'subheader' },
        { text: `Discount Amount: ${discountAmount}`, style: 'subheader' },
        { text: `Grand Total: ${grandTotal}`, style: 'subheader' },
        // Add the order summary section
        { text: 'Order Summary:', style: 'subheader' },
        {
          ul: [
            `Subtotal: ${totalPrice}`,
            `Discount Amount: ${discountAmount}`,
            `Grand Total: ${grandTotal}`,
          ]
        }
      ],
      styles: {
        header: {
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 10],
          alignment: 'center'
        },
        subheader: {
          fontSize: 11,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        subheaderValue: {
          fontSize: 10,
          margin: [0, 10, 0, 5]
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black'
        },
        tableCell: {
          fontSize: 10
        },
        companyName: {
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 5]
        },
        address: {
          fontSize: 10,
          margin: [0, 0, 0, 3]
        }
      }
    };

    // Create a PDF document
    const printer = new PdfPrinter({
      Roboto: {
        normal: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
        bold: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
        italics: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
        bolditalics: Buffer.from(require('pdfmake/build/vfs_fonts').pdfMake.vfs['Roboto-MediumItalic.ttf'], 'base64')
      }
    });
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);

    // Pipe the PDF content to the response
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};





const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus !== 'cancelled') {
      // Add back stock to product sizes
      for (const orderItem of order.items) {
        const product = await Product.findById(orderItem.product);

        if (product) {
          const sizeIndex = product.sizes.findIndex(size => size.size === orderItem.size);
          if (sizeIndex !== -1) {
            product.sizes[sizeIndex].stock += orderItem.quantity;
            await product.save();
          }
        }
      }

      // Refund amount to user's wallet
      const user = await User.findById(order.user);
      if (user) {
        user.wallet += order.grand_total;
        const transaction = {
          description: 'Refund for cancelled order',
          amount: order.grand_total,
          date: new Date()
        };
        user.transactions.push(transaction);
  
        
        await user.save();
      }

      // Update order status to 'cancelled'
      order.orderStatus = 'cancelled';
      await order.save();

      return res.redirect(`/orderItems/${orderId}`);
    } else {
      return res.status(400).json({ message: 'Order is already Cancelled' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};

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

    if (index < 0 || index >= order.items.length) {
      return res.status(400).json({ status: 'error', message: 'Invalid product index' });
    }

    const canceledProduct = order.items[index];
    const canceledProductValue = canceledProduct.price * canceledProduct.quantity;

    // Add back stock to product size
    const product = await Product.findById(canceledProduct.product);
    if (product) {
      const sizeIndex = product.sizes.findIndex(size => size.size === canceledProduct.size);
      if (sizeIndex !== -1) {
        product.sizes[sizeIndex].stock += canceledProduct.quantity;
        await product.save();
      }
    }

    // Revert any changes made to the user's wallet
    const user = await User.findById(order.user);
    if (user) {
      user.wallet += canceledProductValue;
      const transaction = {
        description: 'Refund for cancelled product in order',
        amount: canceledProductValue,
        date: new Date()
      };
      user.transactions.push(transaction);
      await user.save();
    }

    // Set the product as cancelled
    order.items[index].cancelled = true;

    const allItemsCancelled = order.items.every(item => item.cancelled);

    // If all items are cancelled, update the order status to cancelled
    if (allItemsCancelled) {
      order.orderStatus = 'cancelled';
      await order.save();
    }

    return res.redirect(`/orderItems/${orderId}`);
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};

const returnOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    if (order.orderStatus === 'returned') {
      return res.status(400).json({ status: 'error', message: 'Order is already returned' });
    }

    // Return products and adjust stock count
    for (const orderItem of order.items) {
      const product = await Product.findById(orderItem.product);

      if (product) {
        const sizeIndex = product.sizes.findIndex(size => size.size === orderItem.size);
        if (sizeIndex !== -1) {
          product.sizes[sizeIndex].stock += orderItem.quantity;
          await product.save();
        }
      }
    }

    // Refund amount to the user's wallet
    const user = await User.findById(order.user);
    if (user) {
      user.wallet += order.grand_total;
      const transaction = {
        description: 'Refund for returned order',
        amount: order.grand_total,
        date: new Date()
      };
      user.transactions.push(transaction);
      await user.save();
    }

    // Update order status to 'returned'
    order.orderStatus = 'returned';
    await order.save();

    return res.redirect(`/orderItems/${orderId}`);
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};

const returnProduct = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const index = parseInt(req.params.index);

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ status: 'error', message: 'Order is not delivered' });
    }

    if (index < 0 || index >= order.items.length) {
      return res.status(400).json({ status: 'error', message: 'Invalid product index' });
    }

    const returnedProduct = order.items[index];

    if (returnedProduct.returned) {
      return res.status(400).json({ status: 'error', message: 'Product is already returned' });
    }

    // Add back stock to product size
    const product = await Product.findById(returnedProduct.product);
    if (product) {
      const sizeIndex = product.sizes.findIndex(size => size.size === returnedProduct.size);
      if (sizeIndex !== -1) {
        product.sizes[sizeIndex].stock += returnedProduct.quantity;
        await product.save();
      }
    }

    // Refund amount to the user's wallet
    const returnedProductValue = returnedProduct.price * returnedProduct.quantity;
    const user = await User.findById(order.user);
    if (user) {
      user.wallet += returnedProductValue;
      const transaction = {
        description: 'Refund for returned product',
        amount: returnedProductValue,
        date: new Date()
      };
      user.transactions.push(transaction);
      await user.save();
    }

    // Mark the returned product
    returnedProduct.returned = true;

    // Check if all items are returned
    const allItemsReturned = order.items.every(item => item.returned);
    if (allItemsReturned || order.items.length === 1) {
      // Mark the order as returned if all items are returned or if only one item was in the order
      order.orderStatus = 'returned';
      await order.save();
    }

    return res.redirect(`/orderItems/${orderId}`);
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};

const errorPage = async(req,res)=>{
  try {
    const menCategories = await getCategoryiesByType('Men');
    const womenCategories = await getCategoryiesByType('Women');
    const kidsCategories = await getCategoryiesByType('Kids');
    const beautyCategories = await getCategoryiesByType('Beauty');

    const userID = req.session.user_id;
    let message = ''

    res.render('404', { menCategories, womenCategories, kidsCategories, beautyCategories, userID, message });
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
}




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
  generateInvoicePDF,
  cancelOrder,
  cancelProductInOrder,
  loadMyWallet,
  addtowallet,
  razorpaySuccess,
  returnOrder,
  returnProduct,
  errorPage,
}










