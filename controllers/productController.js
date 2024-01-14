const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');



//userSide product Viewing 


//load the Product Page on category order. 


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
  
  



module.exports ={
    renderProductByCategory,
    getProductDetails,
    loadProductList,
    loadaddProduct,
    addProduct,
    loadEditProduct,
    editProduct,
    listProduct,
    unlistProduct
}


