const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');
const sharp = require('sharp');




//load the Product Page on category order. 


const renderProductByCategory = async (req, res) => {
  try {
    let message = '';

    // Check if the user is blocked
    if (req.session.user_id) {
      const userData = await User.findById({ _id: req.session.user_id });
      if (userData && userData.isblocked) {
        message = 'Your Account has been blocked. Kindly signup again';
        return res.render('blocked', { message });
      }
    }
    const sortBy = req.query.sortBy;
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

      products = await Product.find({ category: categoryId, isDeleted: false })
      console.log('Products:', products);
    }

    products = products.filter(product => !product.isDeleted);

    const categories = await Category.find();

    

    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 9;
    const totalItems = 50;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const search = req.query.search || '';

    const next = Math.random() > 0.5;

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

    res.render('viewProducts', {
      userID: req.session.user_id,
      categoryType,
      categoryName,
      categoryId,
      message,
      products,
      category,
      menCategories,
      womenCategories,
      kidsCategories,
      beautyCategories,
      categories,
      categoryID: categoryId,
      count: 10,
      limit: 10,
      sortBy,
      currentPage,
      totalPages,
      search,
      next
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};





// search products

const searchProducts = async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm;
    const sortBy = req.query.sortBy;
    const categoryId = req.query.categoryId;
    console.log('categoryId:', categoryId)

    const category = await Category.findById(categoryId);

    const categoryType = category ? category.categoryType : '';
    const categoryName = category ? category.name : '';

    const searchResults = await Product.find({
      category: categoryId,
      $or: [
        { name: { $regex: new RegExp(searchTerm, 'i') } },
        { color: { $regex: new RegExp(searchTerm, 'i') } },
        { brand: { $regex: new RegExp(searchTerm, 'i') } },
      ],
    });

    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });
    let message = '';
    const userID = req.session.user_id;



    res.render('viewProducts', {
      products: searchResults,
      menCategories,
      womenCategories,
      kidsCategories,
      beautyCategories,
      message,
      userID,
      categoryName,
      categoryType,
      sortBy,
      categoryId
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};


// view the product details page

const getProductDetails = async (req, res) => {
  try {
    let message = '';

    if (req.session.user_id) {
      const userData = await User.findById({ _id: req.session.user_id });
      if (userData) {
        if (userData.isblocked === true) {
          message = 'Your Account has been blocked. Kindly signup again';
          res.render('blocked', { message });
        }
      }
    }

    const productId = req.query.productId;
    const categoryId = req.query.categoryId;




    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    const category = await Category.findById(categoryId);
    console.log("category:", category)

    if (!category) {
      return res.status(404).send('Category not found');
    }

    const products = await Product.find({
      category: category, 
      _id: productId 
    })

    const relatedProducts = await Product.find({
      category: category._id,
      _id: { $ne: productId } // Exclude the current product
    }).limit(4);

    const categoryType = category ? category.categoryType : '';
    const categoryName = category ? category.name : '';
    const productName = product ? product.name:'';


    const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
    const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
    const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
    const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

    res.render('ProductDetails', {
      userID: req.session.user_id, message, category, products,relatedProducts, productImages: product.images, product, menCategories, womenCategories, kidsCategories, beautyCategories,
      categoryType, categoryName,productName,selectedProductId:productId
    })

  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
}








// product management

//Load the product List

const loadProductList = async (req, res) => {
  try {
    let message = ''
    const products = await Product.find().populate('category');
    res.render('productList', { products, message });
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};


// load the addProducts page

const loadaddProduct = async (req, res) => {
  try {
    const categories = await Category.find();
    console.log(categories);
    let message = ''
    res.render('addProducts', { categories, message });
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};



const applyCategoryOfferToProduct = async (product, discountPercentage) => {
  try {
    const oldPrice = parseInt(product.price);

    
    const discountPrice = parseInt((oldPrice * discountPercentage) / 100);

    
    const newPrice = parseInt(oldPrice - discountPrice);

    // Update product offer details
    product.oldPrice = oldPrice;
    product.discountPercentage = discountPercentage; 
    product.discountPrice = discountPrice;
    product.price = newPrice;
    product.isOfferApplied = true;
    product.offerType = 'categoryOffer';
  } catch (error) {
    console.error('Error applying category offer to product:', error);
    throw error;
  }
};


const addProduct = async (req, res) => {
  try {
    const { name, description, brand, price, category, color } = req.body;
    const images = req.files.map(file => file.filename);
    const sizes = req.body.sizes;
    const stocks = req.body.stocks;
    let message = '';

    // Fetch all categories from the database
    const categories = await Category.find();

    // Check if all required fields are filled
    if (!name.trim() || !description.trim() || !brand.trim() || !price || !category || !color.trim()) {
      message = 'Please fill in all the required fields.';
      return res.status(400).render('addProducts', { message, categories });
    }

    // Check if sizes and stocks have the same length
    if (sizes.length !== stocks.length) {
      message = 'Sizes and stocks must have the same length.';
      return res.status(400).render('addProducts', { message, categories });
    }

    // Check if product name already exists
    const existingProduct = await Product.findOne({ name: name.trim() });
    if (existingProduct) {
      message = 'A product with this name already exists.';
      return res.status(400).render('addProducts', { message, categories });
    }

    // Process the images
    const processedImages = await processImages(req.files);

    // Create an array of size-stock objects
    const sizeStocks = sizes.map((size, index) => ({ size, stock: parseInt(stocks[index]) }));

    // Fetch category offer
    const categoryOffer = await Category.findById(category);

    // Create a new product instance
    const newProduct = new Product({
      name: name.trim(),
      description,
      color: color.trim(),
      brand: brand.trim(),
      price,
      category,
      images: processedImages,
      sizes: sizeStocks,
    });

    // Apply category offer to the product if available
    if (categoryOffer && categoryOffer.isOfferApplied) {
      await applyCategoryOfferToProduct(newProduct, categoryOffer.discountPercentage);
    }

    // Save the new product to the database
    await newProduct.save();

    console.log('Product saved successfully:', newProduct); // Log the saved product details

    res.status(200).redirect('/admin/productList');
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};



const processImages = async (files) => {
  const processedImages = [];
  const promises = files.map(file => {
    return new Promise((resolve, reject) => {
      sharp(file.path)
        .resize({ width: 1080, height: 1440 })
        .toFormat('jpeg', { quality: 100 })
        .toFile(`public/uploads/processed-${file.filename}`, (err, info) => {
          if (err) {
            console.error('Error processing image:', err);
            reject(err);
          } else {
            processedImages.push(`processed-${file.filename}`);
            resolve();
          }
        });
    });
  });

  await Promise.all(promises);
  return processedImages;
};




//load the edit Products page

const loadEditProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    const categories = await Category.find();
    let message = ''

    res.render('editProducts', { product, categories, message });
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};



const recalculateProductOffer = async (product) => {
  // Retrieve existing discount percentage
  const existingDiscountPercentage = product.discountPercentage;

  // Convert product price to integer
  const editedPrice = parseInt(product.price);

  const oldPrice = editedPrice;

  // Calculate discount price based on old price and existing discount percentage
  const discountPrice = parseInt(oldPrice * (existingDiscountPercentage / 100));

  // Calculate new price by subtracting discount price from old price
  const newPrice = parseInt(oldPrice - discountPrice);

  // Update product offer details
  product.oldPrice = editedPrice; // Set edited price as old price
  product.discountPrice = discountPrice; // Set calculated discount price
  product.price = newPrice; // Set calculated new price

  // Save the updated product
  await product.save();
};



//Provide the edit function.

const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, brand, price, category, color } = req.body;
    const productImages = req.files;
    const sizes = req.body.sizes;
    const stocks = req.body.stocks;

    // Validate form fields
    if (!name || !description || !brand || !price || !category || !color || !sizes || !stocks || !productImages) {
      // Handle validation errors
      return res.render('editProducts', {
        message: 'Please fill in all the required fields.',
        product: { _id: productId, name, description, brand, price, category, color, sizes: [] }, // Ensure sizes is always defined
        categories: await Category.find()
      });
    }

    // Validate Price
    const validPrice = Number.isFinite(parseFloat(price)) && parseFloat(price) >= 0;
    if (!validPrice) {
      // Handle invalid price
      return res.render('editProducts', {
        message: 'Price must be a non-negative number',
        product: { _id: productId, name, description, brand, price, category, color, sizes: [] }, // Ensure sizes is always defined
        categories: await Category.find()
      });
    }

    // Check if sizes and stocks are negative
    const negativeSizes = sizes.some(size => size <= 0);
    const negativeStocks = stocks.some(stock => stock <= 0);
    if (negativeSizes || negativeStocks) {
      // Handle negative sizes or stocks
      return res.render('editProducts', {
        message: 'Sizes and stocks must be greater than zero.',
        product: { _id: productId, name, description, brand, price, category, color, sizes: [] }, // Ensure sizes is always defined
        categories: await Category.find()
      });
    }

    const product = await Product.findById(productId);

    // Update product details
    product.name = name;
    product.description = description;
    product.brand = brand;
    product.price = parseInt(price);
    product.category = category;
    product.color = color;

    // Update sizes if available
    if (sizes && stocks && sizes.length === stocks.length) {
      const newSizes = sizes.map((size, index) => ({
        size,
        stock: parseInt(stocks[index])
      }));
      product.sizes = newSizes;
    }

    // Update images if available
    if (productImages && productImages.length > 0) {
      const processedImages = await processImages(productImages);
      const existingImages = product.images || [];
      const newImages = processedImages.map(filename => `${filename}`);
      product.images = [...existingImages, ...newImages];
    }

    await product.save();

    // Check if product offer is applied and recalculate the offer
    if (product.isOfferApplied) {
      await recalculateProductOffer(product);
    }

    // Redirect to product list
    res.status(200).redirect('/admin/productList');
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
};






const deleteImage = async (req, res) => {
  try {
    const productId = req.params.id;
    const imageIndex = req.params.imageIndex;

    const product = await Product.findById(productId);

    if (!product) {
      // Product not found, handle appropriately (redirect, error response, etc.)
      return res.status(404).send("Product not found");
    }

    if (imageIndex !== undefined && imageIndex < product.images.length) {

      product.images.splice(imageIndex, 1);
      await product.save();
    }

    res.redirect(`/admin/editProduct/${productId}`);
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
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
    console.error(error);
    res.status(500).render('404');
  }
};


const loadProductOfferManagement = async(req,res)=>{
  try {
    let message = ''
    const products = await Product.find().populate('category');
    res.render('productOfferManagement', { products, message });
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
}

const createOffer = async (req, res) => {
  try {
      const { discountPercentage } = req.body;
      const productId = req.params.productId;

      const product = await Product.findById(productId);

      if (!product) {
          return res.status(404).send('Product not found');
      }

      if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
          return res.status(400).send('Invalid discount percentage');
      }

      let oldPrice = product.price;

      
      const categoryOffer = await Category.findOne({ _id: product.category, isOfferApplied: true });
      if (categoryOffer && categoryOffer.discountPercentage > discountPercentage) {
          console.log('Category offer is greater, retaining it.');
          oldPrice = product.oldPrice;
      }

      const discountPrice = parseInt((oldPrice * discountPercentage) / 100);
      const newPrice = parseInt(oldPrice - discountPrice);

      if (isNaN(newPrice) || isNaN(discountPrice)) {
          return res.status(400).send('Invalid price calculation');
      }

      product.discountPercentage = discountPercentage;
      product.discountPrice = discountPrice;
      product.oldPrice = oldPrice;
      product.price = newPrice;
      product.isOfferApplied = true;
      product.offerType = 'productOffer';

      await product.save();

      

      res.redirect('/admin/productOfferManagement');
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
}



const activateOffer = async(req,res)=>{
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).send('Product not found');
    }

    product.isOfferApplied = true;
    product.offerType = 'productOffer'

    let transPrice = product.price;
    product.price = product.oldPrice;
    product.oldPrice = transPrice;

    await product.save();

    res.redirect('/admin/productOfferManagement'); // Redirect to product offer management page
} catch (error) {
  console.error(error);
  res.status(500).render('404');
}
}


const deactivateOffer = async(req,res)=>{
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).send('Product not found');
    }

    product.isOfferApplied = false;
    

    let transPrice = product.price;
    product.price = product.oldPrice;
    product.oldPrice = transPrice;

    

    await product.save();

    res.redirect('/admin/productOfferManagement'); // Redirect to product offer management page
} catch (error) {
  console.error(error);
  res.status(500).render('404');
}
}

const deleteOffer = async (req, res) => {
  try {
      const productId = req.params.productId;

      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).send('Product not found');
      }

      if(product.oldPrice ===0){
        res.redirect('/admin/productOfferManagement');
      }

      product.price = product.oldPrice;
      product.discountPercentage = 0;
      product.discountPrice = 0;
      product.oldPrice = 0;
      product.isOfferApplied = false;

      await product.save();

      res.redirect('/admin/productOfferManagement'); 
  } catch (error) {
    console.error(error);
    res.status(500).render('404');
  }
}



module.exports = {
  renderProductByCategory,
  getProductDetails,
  loadProductList,
  loadaddProduct,
  addProduct,
  loadEditProduct,
  editProduct,
  deleteImage,
  listProduct,
  unlistProduct,
  searchProducts,
  loadProductOfferManagement,
  createOffer,
  activateOffer,
  deactivateOffer,
  deleteOffer
}


