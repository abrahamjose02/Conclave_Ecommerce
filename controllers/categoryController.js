const Category = require('../models/categoryModel');
const User = require('../models/userModel');






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


  module.exports={
    categoryList,
    listCategories,
    loadaddCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    listCategories,
    unlistCategories
  }
  