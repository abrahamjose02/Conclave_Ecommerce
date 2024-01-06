const User = require('../models/userModel');
const hashPassword = require('../utlis/hashPassword');
const bcrypt = require('bcrypt');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const nodemailer = require('nodemailer');
const { emailUser, emailPassword } = require('../config/configuration');




const loadSignin = async(req,res)=>{
    try{
      const message = 'Welcome to Admin Login'
        res.render('adminLogin',{message});
    }catch(error){
        console.log(error.message);
        res.status(500).json({error:'Cannot Load Login page'});
    }
}

// login with admin details

const insertSignin = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;

        console.log("Entered Email :",email);
        console.log("Entered password :",password);

        const userData = await User.findOne({email:email});
        
        console.log('UserData :',userData);

        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);

            if(passwordMatch){
                if(userData.isadmin === 0){
                    res.render('adminLogin',{message:'Entered Email and password is incorrect'});
                }else{
                  req.session.user_id = userData._id;
                    res.redirect('/admin/home');
                }
            }else{
                res.render('adminLogin',{message:'Entered Email and password is incorrect'});
            }
        }else{
            res.render('adminLogin',{message:'Entered Email and password is Incorrect.'});
        }
    } catch (error) {
        console.log(error.message);
    }
}



const loadHome = async (req, res) => {
  try {
    if (!req.session.user_id) {
      
      return res.redirect('/admin'); 
    }
    const userData = await User.findById(req.session.user_id);
    if (!userData) {
      return res.status(404).send('User data not found');
    }
    let message = '';

    res.render('adminHome', { admin: userData,message });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


const logout = async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/admin');
    } catch (error) {
        console.log(error.message);
        res.status(500).json({error:'An Error has Occured'})
    }
}


        //load forget password page:
   
  const loadforgot = async(req,res)=>{
    try {
      let message =''
      res.render('adminForget',{message});
    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Cannot Load the reset page'})
    }
  }

  // create a transporter

  const transporter = nodemailer.createTransport({
    service:'Gmail',
    auth:{
      user:emailUser,
      pass:emailPassword
    }
  });



  // function to define genrate otp:
  function generateOTP(){
    return Math.floor(100000 + Math.random() * 900000)
  }

  // sending OTP by email;

  const sendOTPByEmail = async(email,OTP)=>{
    try {
      const mailOptions ={
        from:emailUser,
        to:email,
        subject:'You OTP for Reseting Password',
        text:`Your OTP for Reset is ${OTP}`
      };
      const sendMailResult = await transporter.sendMail(mailOptions);
      console.log('Email sent with OTP Successfully');

    } catch (error) {
      console.log(error.message);
    }
  }

  //Entering the reset email and send otp for verification 

  const resetOTP = async(req,res)=>{
    try {
      const email = req.body.email;
      
      
      const generatedOTP = generateOTP();

      req.session.userData = {
        email,
        OTP: generatedOTP
      };
      

      console.log(req.session.userData);

      await sendOTPByEmail(email,generatedOTP);

      res.redirect('/admin/forgot_verify');

    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Cannot send OTP'})
      
    }
  }

  // Render the Reset password verification page

  const loadResetVerify = async(req,res)=>{
    try {
      let message = ''
      res.render('adminForgot_verify',{message});
    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Cannot load Verification page'})
    }
  }

// reset otp verification

  const otpVerify = async(req,res)=>{
    try {
      console.log(req.body);
      const{email,enteredOTP} = req.body;

      const userData = req.session.userData;

      console.log("Entered OTP:",enteredOTP);
      console.log("Stored OTP:",userData.OTP);

      const cleanedEnteredOTP = String(enteredOTP).trim();
      const cleanedStoredOTP = String(userData.OTP).trim();

      if(cleanedStoredOTP === cleanedEnteredOTP){
        
        res.redirect('/admin/reset_password');
      }else{
        let message='Entered OTP is Invalid. Kindly reenter the OTP'
        res.status(400).render('adminForgot_verify',{message});
       
      }
    } catch (error) {
      console.log(error.message);
      let message="Invalid Server Error"
      res.status(500).render('adminForgot_verify',{message});
    }
  }

  //Load the reset password page

  const loadResetPassword = async(req,res)=>{
    try {
      let message=''
        res.render('adminReset_password',{message});
    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Cannot load Reset password page'})
    }
  }
  

  const resetPassword = async(req,res)=>{
    try {
      
      const{new_password, confirm_password} = req.body;
      if(new_password !== confirm_password){
        return res.status(400).render('adminReset_password',{message:'Password are not same'});
      }

      const {email} = req.session.userData;
      
      
      const user = await User.findOne({email:email});

      if(!user){
        return res.status(404).json({error:'User not found'});
      }

      const hashedPassword = await hashPassword(new_password);

      user.password = hashedPassword;
      
      await user.save();

      req.session.userData = null;

      res.redirect('/admin')

    } catch (error) {
      console.log(error.message);
      res.status(500).json({error:'Invalid Session Error'});
    }
  }

  //load userList

  const userList = async (req, res) => {
    try {
      let message ='';
        const userData = await User.find({ isadmin: 0 });
      console.log(userData);
        res.render('userList', { users: userData ,message });
    } catch (error) {
        console.log(error.message);
    }
};


const searchUser = async(req,res)=>{
  try {
    const query = req.query.query;
    const users = await User.find({
      $and:[
        {
          $or:[
            {name:{$regex : query, $options : 'i'}},
            {email:{$regex: query, $options : 'i'}},
          ],
        },
        {isadmin:{$ne:1}},

      ],

    });
    res.render('userList',{users:users});
  } catch (error) {
    console.log(error.message);
  }
}

const editUserLoad = async(req,res)=>{
  try {
    const id = req.query.id;
    const userData = await User.findById({_id:id});

    if(userData){
      res.render('editUser',{user:userData});
    }
    else{
      res.redirect('/admin/userList');
    }
  } catch (error) {
    console.log(error.message);
  }
}
  
const updateUser = async(req,res)=>{
  try {
    const userData = await User.findByIdAndUpdate({_id:req.body._id},{$set:{name:req.body.name,email:req.body.email,phone:req.body.phone}});
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

// category page


//Load the Category list 

const categoryList = async(req,res)=>{
  try {
    const categories = await Category.find();
    let message='';
    
    res.render('categoriesList',{categories,message});
  } catch (error) {
    console.log(error.message);
  }
};

const createSampleCategories = async (req,res) => {
  try {
    await Category.create([
      {
        name: 'Women Hoodies',
        description: 'Hoodies for Women',
        categoryType: 'Women',
        dateCreated: new Date()
      },
      
    ]);
    console.log('Sample categories added successfully');
  } catch (error) {
    console.error('Error creating sample categories:', error);
  }
};

//load add category

const loadaddCategory = async (req, res) => {
  try {
    let message=''
    res.render('addCategory',{message});
  } catch (error) {
    console.error('Error loading addCategory:', error);
    
  }
};

// adding the category details

const addCategory = async (req, res) => {
  try {
    const { name, description, categoryType } = req.body;

    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

    if (existingCategory) {
      return res.status(400).render('addCategory', { message: 'Category with the same name already exists.' });
    }

    const newCategory = new Category({
      name: name,
      description: description,
      categoryType: categoryType,
      dateCreated: new Date(),
      image: req.file.filename,
    });

    await newCategory.save();

    res.redirect('/admin/categoriesList');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

//load the editCategory

const loadEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id; 
    let message='';

    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

    if (existingCategory) {
      return res.status(400).render('addCategory', { message: 'Category with the same name already exists.' });
    }
    
    const category = await Category.findById(categoryId);

    if (category) {
      res.render('editCategory', { category,message }); 
    } else {
      res.redirect('/admin/categoriesList');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Invalid Server Error');
  }
};

// Editing the category option.

const editCategory = async (req, res) => {
  try {
    const categoryId = req.params.id; 
    const { name, description, categoryType } = req.body; 
    const categoryImage = req.file;
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).send('Category not found');
    }

    if(name.toLowerCase() !== category.name.toLowerCase()){
      const existingCategory = await Category.findOne({name:{$regex: new RegExp(`^${name}$`,'i')}});
      if(existingCategory){
        return res.status(400).render('editCategory',{message:'Category name already Exist'})
      }
    }

    category.name = name;
    category.description = description;
    category.categoryType = categoryType;

    if (categoryImage) {
      category.image = categoryImage.filename;
    }

    const updatedCategory = await category.save();
    res.redirect('/admin/categoriesList');

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};


//unlist the categories 

const unlistCategories = async(req,res)=>{
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);

    if(category ){
      category.isDeleted =true;
      await category.save();
      res.redirect('/admin/categoriesList');
    }else{
      res.status(404).send('Category not found');
    }
  } catch (error) {
    console.log(error.message);
  }
};

//list the categories

const listCategories = async(req,res)=>{
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);

    if(category){
      category.isDeleted = false;
      await category.save();
      res.redirect('/admin/categoriesList');
    }else{
      res.status(404).send('Category not found');
    }
  } catch (error) {
    console.log(error.message);
  }
}

// product management

//Load the product List

const loadProductList = async (req, res) => {
  try {
    let message=''
    const products = await Product.find().populate('category');
    res.render('productList', { products,message});
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};



const createSampleProducts = async (req, res) => {
  try {
    await Product.create([
      {
        name: 'Slim Fit T-Shirt',
        description: 'Comfortable and stylish slim fit t-shirt.',
        size: 'm',
        brand: 'FashionBrand',
        stockinCount: 50,
        price: 19.99,
        category: '658b176fea4d082b33a24922', 
        image: 'https://example.com/tshirt1.jpg', 
        images: [
          'https://example.com/tshirt1.jpg',
          'https://example.com/tshirt2.jpg',
          'https://example.com/tshirt3.jpg'
        ], 
        isDeleted: false,
        rating: 4.5,
        isFeatured: true,
        dateCreated: new Date()
      },
      {
        name: 'Casual Jeans',
        description: 'Classic casual jeans for everyday wear.',
        size: 'l',
        brand: 'DenimBrand',
        stockinCount: 30,
        price: 39.99,
        category: '658abafbdc0aedd8e64dd151',
        image: 'https://example.com/jeans1.jpg', 
        images: [
          'https://example.com/jeans1.jpg',
          'https://example.com/jeans2.jpg'
        ], 
        isDeleted: false,
        rating: 4.2,
        isFeatured: false,
        dateCreated: new Date()
      },
      
    ]);
    console.log('Sample products added successfully');
    res.send('Sample products added successfully');
  } catch (error) {
    console.error('Error creating sample products:', error);
    res.status(500).send('Internal Server Error');
  }
};

// load the addProducts page

const loadaddProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    console.log(categories);
    let message=''
    res.render('addProducts', { categories,message });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

// add the products here with details

const addProduct = async (req, res) => {
  try {
    const categories = await Category.find();

    const { name, description, brand, stockinCount, price, category,color } = req.body;
    const images = req.files.map(file =>file.filename);
    let message=''
    
    if (!name || !description || !brand || !stockinCount || !price || !category || !images ||!color) {
      return res.status(400).render('addProducts',{message:'Please fill in all the required fields.'});
    }

    const existingProduct = await Product.findOne({name:{$regex:new RegExp(`^${name}$`,'i')}});
    if(existingProduct){
      return res.render('addProduct',{message:'Product with the same name already Exist.',categories})
    }

    const validPrice = Number.isFinite(parseFloat(price)) && parseFloat(price)>=0;
    if(!validPrice){
       return res.render('addProducts',{message:'Price  must be a non-negative number',categories})
    }
    const validStock = Number.isInteger(parseInt(stockinCount)) && parseInt(stockinCount) >=0;
    if(!validStock){
       return res.render('addProducts',{message:'Stock Count must be a non-negative number',categories});
    } 

 const newProduct = new Product({
      name,
      description,
      color,
      brand,
      stockinCount,
      price,
      category,
      images
    });

    
    await newProduct.save();

    res.status(200).redirect('/admin/productList');
    }
   catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};

//load the edit Products page

const loadEditProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    const categories = await Category.find();
    let message=''

    res.render('editProducts', { product ,categories,message }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

//Provide the edit function.

const editProduct = async(req,res)=>{
  try{
    const productId = req.params.id
    const{name,description,brand,stockinCount,price,category,color} = req.body;
    const productImages = req.file;

    let message=''

    const product = await Product.findById(productId);

    product.name = name;
    product.description = description;
    product.brand = brand;
    product.stockinCount = stockinCount;
    product.price = price;
    product.color = color;
    product.category = category;
  

  if(productImages && productImages > 0){
  
    const newImages = productImages.map(file => file.path);
    product.images = newImages;
  }

  const updateProduct = await product.save();
  res.status(200).redirect('/admin/productList');

}catch(error){
  console.log(error.message);
}
}

//list the products

const listProduct = async (req, res) => {
  try {
    const productId = req.params.id;
     
    const products = await Product.findById(productId);
    console.log(products);

    if (products) {
      
      products.isDeleted = false;
      await products.save();
      res.redirect('/admin/productList');

    } else {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

//unlist the products

const unlistProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const products = await Product.findById(productId);

    if (products) {

      products.isDeleted = true;
      await products.save();
      res.redirect('/admin/productList');

    } else {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};




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
    loadHome,
    userList,
    searchUser,
    editUserLoad,
    updateUser,
    blockUser,
    unBlockUser,
    categoryList,
    createSampleCategories,
    loadaddCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    unlistCategories,
    listCategories,
    loadProductList,
    createSampleProducts,
    loadaddProduct,
    addProduct,
    loadEditProduct,
    editProduct,
    listProduct,
    unlistProduct

}