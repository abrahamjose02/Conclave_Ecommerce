
const User = require('../models/userModel');
const hashPassword = require('../utlis/hashPassword');
const nodemailer = require('nodemailer');
const { emailUser, emailPassword } = require('../config/configuration');
const bcrypt = require('bcrypt');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');



const loadsignup = async(req,res)=>{
    try{
        
        const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
                  const womenCategories = await Category.find({ categoryType:'Women' , isDeleted: false});
                  const kidsCategories = await Category.find({ categoryType:'Kids',isDeleted:false});
                  const beautyCategories = await Category.find({ categoryType:'Beauty',isDeleted:false});

                  const userID = req.session.user_id || null;
                  const message = ' Welcome ! Please signup to create an Account';

                  res.render('signup',{menCategories,womenCategories,kidsCategories,beautyCategories,userID,message});
    }catch(error){
        console.log(error);
    }
}
    
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user:emailUser,
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
      const { name, email, password,phone } = req.body;

      //render the templates

      const userID = req.session.user_id || null;
      const menCategories = await Category.find({categoryType:'Men',isDeleted:false});
      const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
      const kidsCategories = await Category.find({ categoryType:'Kids',isDeleted:false});
      const beautyCategories = await Category.find({ categoryType:'Beauty',isDeleted:false});




      const nameRegex = /^(?! )[A-Za-z\s]+(?! )$/;
      const emailRegex = /^\S+@\S+\.\S+$/; 
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+]{8,}$/; 
        const phoneRegex = /^\d{10}$/;

        if(!nameRegex.test(name)){
          return res.render('signup',{message:'Please enter a valid name',menCategories,womenCategories,kidsCategories,beautyCategories,userID});
        }

        if(!emailRegex.test(email)){
          return res.render('signup',{message:'Please Enter a valid Email',menCategories,womenCategories,kidsCategories,beautyCategories,userID})
        }
        if(!passwordRegex.test(password)){
          return res.render('signup',{message:'Please enter a valid password',menCategories,womenCategories,kidsCategories,beautyCategories,userID})
        }
        if(!phoneRegex.test(phone)){
          return res.render('signup',{message:'Please enter valid 10 digit phone number',menCategories,womenCategories,kidsCategories,beautyCategories,userID})
        }
        const existingUser = await User.findOne({email:email});
        if(existingUser){
          return res.render('signup',{message:'Email already exist . Kindly Log In ',menCategories,womenCategories,kidsCategories,beautyCategories,userID})
        }

      const generatedOTP = generateOTP();
      
      
  
      req.session.userData = {
        name,
        email,
        password,
        phone,
        isadmin:0,
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

      let message =''

      const userID = req.session.user_id || null;
      const menCategories = await Category.find({categoryType:'Men',isDeleted:false});
      const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
      const kidsCategories = await Category.find({ categoryType:'Kids',isDeleted:false});
      const beautyCategories = await Category.find({ categoryType:'Beauty',isDeleted:false});

        res.render('verify',{message,menCategories,womenCategories,kidsCategories,beautyCategories,userID});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

       //verify otp
  
  const verifyOTP = async (req, res) => {
    try {

      const menCategories = await Category.find({categoryType:'Men',isDeleted:false});
      const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
      const kidsCategories = await Category.find({ categoryType:'Kids',isDeleted:false});
      const beautyCategories = await Category.find({ categoryType:'Beauty',isDeleted:false});
      const userID = req.session.user_id || null;
      let message= ''


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
          isadmin:userData.is_admin,
          phone:userData.phone,
          password: hashedPassword
        });
  
        await newUser.save();
  
        req.session.userData = null;
  
        res.redirect('/');
      } else {
        res.status(400).render('verify',{message:'Invalid OTP. Please Try Again',menCategories,womenCategories,kidsCategories,beautyCategories,userID,message});
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  //resend OTP

  const resendOTP = async(req,res)=>{
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

  const loadlogin = async(req,res) =>{
    try {
      const menCategories = await Category.find({categoryType:'Men',isDeleted:false});
      const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
      const kidsCategories = await Category.find({categoryType:'Kids',isDeleted:false});
      const beautyCategories = await Category.find({categoryType:'Beauty',isDeleted:false});

      const userID = req.session.user_id || null;

      let message= 'Welcome ! Please login to your Account'

      res.render('login',{message,userID,menCategories,womenCategories,kidsCategories,beautyCategories});
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: 'Cannot load Login page' });
    }
  }

  //user logins

  const loginUser = async(req,res)=>{
    try {
      const email = req.body.email;
      const password = req.body.password;

      console.log('Entered Email:',email);
      console.log('Entered Password:',password);

      const userID = req.session.user_id || null;

      const menCategories = await Category.find({categoryType:'Men',isDeleted:false});
      const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
      const kidsCategories = await Category.find({categoryType:'Kids',isDeleted:false});
      const beautyCategories = await Category.find({categoryType:'Beauty',isDeleted:false});

      


      const userData = await User.findOne({email:email});
      console.log('UserData :',userData);

      if(userData){
        const passwordMatch = await bcrypt.compare(password,userData.password);
        console.log('Password Match :', passwordMatch);
        if(passwordMatch){

          req.session.user_id = userData._id;
          res.redirect('/home');
          
        }
        else{
          res.render('login',{message:'Email and password is incorrect',userID,menCategories,womenCategories,kidsCategories,beautyCategories});
          console.log('Email and password is incorrect');
        }
        
      }
      else{
        res.render('login',{message:'Email and password is incorrect',userID,menCategories,womenCategories,kidsCategories,beautyCategories});
        console.log('Email and password is incorrect');
      }

    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Cannot login'});
    }
  }

  //load home page

  const loadHome = async (req, res) => {
      try {
          let message = '';
  
          if (req.session.user_id) {
              const userData = await User.findById({_id: req.session.user_id});
              if (userData) {
                  if (userData.isblocked === true) {
                     
                      return res.redirect('/blockedUser');
                  }
  
                  // Fetch menCategories
                  const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
                  const womenCategories = await Category.find({ categoryType:'Women' , isDeleted: false});
                  const kidsCategories = await Category.find({ categoryType:'Kids',isDeleted:false});
                  const beautyCategories = await Category.find({ categoryType:'Beauty',isDeleted:false});
  
                  // Render the home page with userData, userID, message, and menCategories
                  message = `Welcome back, ${userData.name}!`; // Welcome back message for logged-in users
                  return res.render('home', { user: userData, userID: req.session.user_id, message, menCategories,womenCategories,kidsCategories,beautyCategories });
              }
          } else {
              message = 'Please log in to continue.'; // Prompt to log in for non-logged-in users
              res.redirect('/signup');
          }
      } catch (error) {
          console.log(error.message);
          res.status(500).json({ error: 'Failed to load Home Page' });
          res.redirect('/');
      }
  };

  // page to render the blocked user

  const blockedUser = async(req,res)=>{
    try {
      const userID = req.session.user_id || null;
      
      const userData = await User.findById(userID);

      if(userData && userData.isblocked){

        let message ='Your Account has been Blocked by the admin. Kindly Sign up with a different Account.'
        const menCategories = await Category.find({categoryType:'Men',isblocked:false});
      const womenCategories = await Category.find({categoryType:'Women',isblocked:false});
      const kidsCategories = await Category.find({categoryType:'Kids',isblocked:false});
      const beautyCategories = await Category.find({categoryType:'Beauty',isblocked:false});

      res.render('blockedUser',{userID,message,menCategories,womenCategories,kidsCategories,beautyCategories});
      }
      else{
        res.redirect('/home');
      }

      
    } catch (error) {
      console.log(error.message);
    }
  }
  

  //logout page

  const logout = async(req,res)=>{
    try {
      req.session.destroy();
      res.redirect('/');
    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Error'})
    }
  }

  //load forget password page
   
  const loadforgot = async(req,res)=>{
    try {

      const menCategories = await Category.find({categoryType:'Men', isDeleted:false});
      const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
      const kidsCategories = await Category.find({categoryType:'Kids',isDeleted:false});
      const beautyCategories = await Category.find({categoryType:'Beauty',isDeleted:false});

      const userID = req.session.user_id ||null;

      let message ='';

      res.render('forget',{message,menCategories,womenCategories,kidsCategories,beautyCategories,userID});
    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Cannot Load the reset page'})
    }
  }

  //Entering the reset email and send otp for verification 

  const resetOTP = async(req,res)=>{
    try {

      const menCategories = await Category.find({categoryType:'Men', isDeleted:false});
      const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
      const kidsCategories = await Category.find({categoryType:'Kids',isDeleted:false});
      const beautyCategories = await Category.find({categoryType:'Beauty',isDeleted:false});

      const userID = req.session.user_id ||null;

      let message ='';


      const email = req.body.email;
      if(!email){
        return res.status(400).render('forget',{message,menCategories,womenCategories,kidsCategories,beautyCategories,userID})
      }
      
      const generatedOTP = generateOTP();

      req.session.userData = {
        email,
        OTP: generatedOTP
      };

      await sendOTPByEmail(email,generatedOTP);

      res.redirect('/forgot_verify');

      
    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Cannot send OTP'})
      
    }
  }

  // Render the Reset password verification page

  const loadResetVerify = async(req,res)=>{
    try {

      const menCategories = await Category.find({categoryType:'Men', isDeleted:false});
      const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
      const kidsCategories = await Category.find({categoryType:'Kids',isDeleted:false});
      const beautyCategories = await Category.find({categoryType:'Beauty',isDeleted:false});

      const userID = req.session.user_id ||null;

      let message ='';

      res.render('forgot_verify',{menCategories,womenCategories,kidsCategories,beautyCategories,message,userID});
    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Cannot load Verification page'})
    }
  }

// reset otp verification

  const otpVerify = async(req,res)=>{
    try {
      const{email,enteredOTP} = req.body;


      const menCategories = await Category.find({categoryType:'Men', isDeleted:false});
      const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
      const kidsCategories = await Category.find({categoryType:'Kids',isDeleted:false});
      const beautyCategories = await Category.find({categoryType:'Beauty',isDeleted:false});

      const userID = req.session.user_id ||null;

      let message ='';



      const storedOTP = req.session.userData.OTP;
      if(!storedOTP){
        res.render('forget_verify',menCategories,womenCategories,kidsCategories,beautyCategories,userID,message)
      }

      console.log("Entered OTP:",enteredOTP);
      console.log("Stored OTP:",storedOTP);

      const cleanedEnteredOTP = String(enteredOTP).trim();
      const cleanedStoredOTP = String(storedOTP).trim();

      if(cleanedStoredOTP === cleanedEnteredOTP){
        
        res.redirect('/reset_password');
      }else{

        res.status(400).render('forgot_verify',{message:'Invalid OTP. Please try again '})
        
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Internal Server Error'})
      res.render('forgot_verify');
    }
  }

  const loadResetPassword = async(req,res)=>{
    try {

      const menCategories = await Category.find({categoryType:'Men', isDeleted:false});
      const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
      const kidsCategories = await Category.find({categoryType:'Kids',isDeleted:false});
      const beautyCategories = await Category.find({categoryType:'Beauty',isDeleted:false});

      const userID = req.session.user_id ||null;

      let message ='';
        res.render('reset_password',{message,menCategories,womenCategories,kidsCategories,beautyCategories,userID});
    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Cannot load Reset password page'})
    }
  }
  

  const resetPassword = async(req,res)=>{
    try {
      
      const menCategories = await Category.find({categoryType:'Men', isDeleted:false});
      const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
      const kidsCategories = await Category.find({categoryType:'Kids',isDeleted:false});
      const beautyCategories = await Category.find({categoryType:'Beauty',isDeleted:false});

      const userID = req.session.user_id ||null;

      let message ='';
      


      const{new_password, confirm_password} = req.body;
      if(new_password !== confirm_password){
        return res.status(400).render('reset_password',{message:'Password are not same',menCategories,womenCategories,kidsCategories,beautyCategories,userID});
      }


      console.log(req.session.userData)

      const {email} = req.session.userData;
      
      const user = await User.findOne({email:email});
      
      if(!user){
        return res.status(404).json({error:'User not found'});
      }

      const hashedPassword = await hashPassword(new_password);

      user.password = hashedPassword;
      
      await user.save();

      req.session.userData = null;

      res.redirect('/')

    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Invalid Session Error'});
    }
  }

  const renderProductByCategory = async (req, res) => {
    try {

      let message = '';
        if(req.session.user_id){
          const userData = await User.findById({_id:req.session.user_id});
          if(userData){
            if(userData.isblocked === true){
              message = 'Your Account has been blocked. Kinldy signup again';
              res.render('blocked',{message})
            }
          }
        }
        const categoryId = req.query.category;
        console.log('Category ID:', categoryId);
        
        const category = await Category.findOne({ _id: categoryId });
        console.log('Category:', category);

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const categoryType = category ? category.categoryType : '';
        const categoryName = category ? category.name : '';

        const categoryDeleted = category ? category.isDeleted : false;

        let products = [];

        if (!categoryDeleted) {
            products = await Product.find({ category: categoryId, isDeleted: false });
            console.log('Products:', products);
        }

        products = products.filter(product => !product.isDeleted);

        const categories = await Category.find();

        const sortBy = req.query.sortBy

        const currentPage = parseInt(req.query.page) || 1;

        const itemsPerPage = 9; 
        const totalItems = 50;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const search = req.query.search || '';

        const next = Math.random() > 0.5 ? true : false;

        const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
                  const womenCategories = await Category.find({ categoryType:'Women' , isDeleted: false});
                  const kidsCategories = await Category.find({ categoryType:'Kids',isDeleted:false});
                  const beautyCategories = await Category.find({ categoryType:'Beauty',isDeleted:false});

        res.render('viewProducts', { userID:req.session.user_id,categoryType,categoryName,categoryId, message, products, category , menCategories,womenCategories,kidsCategories,beautyCategories ,categories , categoryID:categoryId,count:10,limit:10,sortBy,currentPage,totalPages,search,next});
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Failed to load products' });
    }
};

const loadUserAccount = async(req,res)=>{
  try {
    res.render('myAccount');
  } catch (error) {
    console.log(error.message);
  }
}


// view the product details page

const getProductDetails = async(req,res)=>{
  try {
    let message='';

    if(req.session.user_id){
        const userData = await User.findById({_id:req.session.user_id});
        if(userData){
          if(userData.isblocked ===true){
            message= 'Your Account has been blocked. Kindly signup again';
            res.render('blocked',{message});
          }
        }
    }
    
    const productId = req.query.productId;

   

    const product = await Product.findById(productId);
    if(!product){
      return res.status(404).send('Product not found');
    }

    const category = await Category.findById(product.category);

    if (!category) {
      return res.status(404).send('Category not found');
    }

    const products = await Product.find({
      category: product.category, // Assuming 'category' is the field holding the category reference
      _id: productId // Exclude the displayed product itself
    })

    

    const categoryType = product.category ? product.category.categoryType : '';
    const categoryName = product.category ? product.category.name : '';
        

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
                  const womenCategories = await Category.find({ categoryType:'Women' , isDeleted: false});
                  const kidsCategories = await Category.find({ categoryType:'Kids',isDeleted:false});
                  const beautyCategories = await Category.find({ categoryType:'Beauty',isDeleted:false});

    res.render('ProductDetails',{userID:req.session.user_id,message,category,products,productImages:product.images,product,menCategories,womenCategories,kidsCategories,beautyCategories,
      categoryType,categoryName})
    
  } catch (error) {
    console.log(error.message);
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
    renderProductByCategory,
    loadUserAccount,
    blockedUser,
    getProductDetails

  }
  









