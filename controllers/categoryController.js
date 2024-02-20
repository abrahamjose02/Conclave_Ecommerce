const Category = require('../models/categoryModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');



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

      const category = await Category.findById(categoryId);
      console.log(category);
  
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
            return res.status(404).render('editCategory', { message: 'Category not found' });
        }

        // Validation: Category name should not be empty, start with a space, and should be unique
        if (!name.trim() || name.trim().startsWith(' ')) {
            return res.status(400).render('editCategory', { message: 'Category name should not be empty or start with a space', category });
        }

        if (name.toLowerCase() !== category.name.toLowerCase()) {
            const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
            if (existingCategory) {
                return res.status(400).render('editCategory', { message: 'Category name already exists', category });
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
        res.status(500).render('editCategory', { message: 'Internal Server Error', category });
    }
};

  
  //unlist the categories 
  
  const unlistCategories = async(req,res)=>{
    try {
      const categoryId = req.params.id;
      const category = await Category.findById(categoryId);
  
      if(category){
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


  const categoryOfferManagement = async(req,res)=>{
    try {
      let message = '';
      const categories = await Category.find();
      res.render('categoryOfferManagement',{categories,message});
    } catch (error) {
      console.log(error.message);
      res.status(500).json({message:'Invalid Session Error'});
    }
  }



// Controller code for creating category offers
const createCategoryOffer = async (req, res) => {
  try {
      const categoryId = req.params.categoryId;
      const category = await Category.findById(categoryId);

      if (!category) {
          return res.status(404).json({ status: false, message: 'Category not found' });
      }

      const categoryDiscountPercentage = parseFloat(req.body.discountPercentage);

      if (!categoryDiscountPercentage || isNaN(categoryDiscountPercentage)) {
          return res.status(400).json({ status: false, message: 'Discount percentage is required and must be a number' });
      }

      // Find the maximum discount percentage among existing product offers in the category
      const maxProductDiscountPercentage = await findMaxProductDiscountPercentage(categoryId);

      // Apply category offer to products if category discount percentage is greater
      if (categoryDiscountPercentage > maxProductDiscountPercentage) {
          // Update category's discount percentage and isOfferApplied flag
          category.discountPercentage = categoryDiscountPercentage;
          category.isOfferApplied = true;
          await category.save();

          // Apply the category offer to the products in the category
          await applyCategoryOfferToProducts(categoryId, categoryDiscountPercentage);

          res.redirect('/admin/categoryOfferManagement');
      } else {
          res.status(400).json({ status: false, message: 'Category offer discount percentage is not greater than existing product offers' });
      }
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Function to find the maximum discount percentage among existing product offers in the category
const findMaxProductDiscountPercentage = async (categoryId) => {
  const products = await Product.find({ category: categoryId, isOfferApplied: true });
  let maxDiscountPercentage = 0;

  for (const product of products) {
      maxDiscountPercentage = Math.max(maxDiscountPercentage, product.discountPercentage);
  }

  return maxDiscountPercentage;
};

// Function to apply the category offer to the products in the category
const applyCategoryOfferToProducts = async (categoryId, discountPercentage) => {
  const products = await Product.find({ category: categoryId });

  for (const product of products) {
      const productDiscountPercentage = product.discountPercentage;

      // Check if product has an offer applied and if category offer is greater
      if (!product.isOfferApplied || discountPercentage > productDiscountPercentage) {
          let oldPrice = product.price; // Default to product price

          // Check if there is an existing product offer and if it's less than the category offer
          if (product.isOfferApplied && product.discountPercentage < discountPercentage) {
              oldPrice = product.oldPrice; // Use product's old price if it has a lesser offer
          }

          const discountPrice = parseInt((oldPrice * discountPercentage) / 100);
          const newPrice = parseInt(oldPrice - discountPrice);
        
          product.discountPercentage = discountPercentage;
          product.discountPrice = discountPrice;
          product.price = newPrice;
          product.oldPrice = oldPrice;
          product.isOfferApplied = true;
          product.offerType = 'categoryOffer';

          await product.save();
      }
  }
};


const activateCategoryOffer = async (req, res) => {
  try {
      const categoryId = req.params.categoryId;
      const category = await Category.findById(categoryId);

      if (!category) {
          return res.status(404).json({ status: false, message: 'Category not found' });
      }

      if (category.isOfferApplied) {
          return res.status(400).json({ status: false, message: 'Category offer is already activated' });
      }

      // Update the category to activate the offer
      await Category.findByIdAndUpdate(categoryId, { isOfferApplied: true });

      // Update all products in the category to activate the offer
      const products = await Product.find({ category: categoryId });

      for (const product of products) {
          // Swap price and oldPrice for each product
          const transPrice = product.price;
          product.price = product.oldPrice;
          product.oldPrice = transPrice;

          // Set isOfferApplied to true
          product.isOfferApplied = true;

          // Save the updated product
          await product.save();
      }

      res.redirect('/admin/categoryOfferManagement');
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};



  const deactivateCategoryOffer = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({ status: false, message: 'Category not found' });
        }

        if (!category.isOfferApplied) {
            return res.status(400).json({ status: false, message: 'Category offer is already deactivated' });
        }

        // Update the category to deactivate the offer
        await Category.findByIdAndUpdate(categoryId, { isOfferApplied: false });

        

        // Restore the original price in products and swap price and oldPrice
        const products = await Product.find({ category: categoryId });
        for (const product of products) {
            // Swap price and oldPrice
            const tempPrice = product.price;
            product.price = product.oldPrice;
            product.oldPrice = tempPrice;

            product.isOfferApplied = false;

            // Save the updated product
            await product.save();
        }

        res.redirect('/admin/categoryOfferManagement');
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
};


const deleteCategoryOffer = async (req, res) => {
  try {
      const categoryId = req.params.categoryId;
      const category = await Category.findById(categoryId);

      if (!category) {
          return res.status(404).json({ status: false, message: 'Category not found' });
      }

     
      const products = await Product.find({ category: categoryId });

      for (const product of products) {
          
         product.price = product.oldPrice;
         product.discountPercentage = 0;
         product.discountPrice = 0;
         product.oldPrice = 0;
         
        product.isOfferApplied = false;

          await product.save();
      }

      await Category.findByIdAndUpdate(categoryId, { 
          isOfferApplied: false, 
          discountPercentage: 0 
      });

      res.redirect('/admin/categoryOfferManagement');
  } catch (error) {
      console.error('Error deleting category offer:', error);
      res.status(500).send('Error deleting category offer');
  }
};


  module.exports={
    categoryList,
    listCategories,
    loadaddCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    listCategories,
    unlistCategories,
    categoryOfferManagement,
    createCategoryOffer,
    activateCategoryOffer,
    deactivateCategoryOffer,
    deleteCategoryOffer
  }
  