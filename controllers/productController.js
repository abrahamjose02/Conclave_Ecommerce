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
    console.error(error.message);
    res.status(500).json({ error: 'Failed to load products' });
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
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
};


// const sortFeature = async (req, res) => {
//   try {
//     let message = '';

//     // Check if the user is blocked
//     if (req.session.user_id) {
//       const userData = await User.findById({ _id: req.session.user_id });
//       if (userData && userData.isblocked) {
//         message = 'Your Account has been blocked. Kindly signup again';
//         return res.render('blocked', { message });
//       }
//     }
//     const sortBy = req.query.sortBy;
// const categoryId = req.query.categoryId; 

//     console.log('Category ID:', categoryId);

//     let sortCriteria = {};
//     if (sortBy === 'lowPrice') {
//       sortCriteria = { price: 1 }; // Ascending order
//     } else if (sortBy === 'highPrice') {
//       sortCriteria = { price: -1 }; // Descending order
//     } else {
//       // Add a default sorting criteria if sortBy is not recognized
//       sortCriteria = { createdAt: -1 }; // You can change 'createdAt' to any field you want
//     }

//     const category = await Category.findOne({ _id: categoryId });
//     console.log('Category:', category);

//     if (!category) {
//       return res.status(404).json({ error: 'Category not found' });
//     }

//     const categoryType = category ? category.categoryType : '';
//     const categoryName = category ? category.name : '';

//     const categoryDeleted = category ? category.isDeleted : false;

//     let products = [];

//     if (!categoryDeleted) {

//       products = await Product.find({ category: categoryId, isDeleted: false }).sort(sortCriteria)
//       console.log('Products:', products);
//     }

//     products = products.filter(product => !product.isDeleted);

//     const categories = await Category.find();

    

//     const currentPage = parseInt(req.query.page) || 1;
//     const itemsPerPage = 9;
//     const totalItems = 50;
//     const totalPages = Math.ceil(totalItems / itemsPerPage);
//     const search = req.query.search || '';

//     const next = Math.random() > 0.5;

//     const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
//     const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
//     const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
//     const beautyCategories = await Category.find({ categoryType: 'Beauty', isDeleted: false });

//     res.render('viewProducts', {
//       userID: req.session.user_id,
//       categoryType,
//       categoryName,
//       categoryId,
//       message,
//       products,
//       category,
//       menCategories,
//       womenCategories,
//       kidsCategories,
//       beautyCategories,
//       categories,
//       categoryID: categoryId,
//       count: 10,
//       limit: 10,
//       sortBy,
//       currentPage,
//       totalPages,
//       search,
//       next
//     });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json({ error: 'Failed to load products' });
//   }
// };

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

    const relatedProducts = await Product.find({ category: product.category }).limit(4);

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
    console.log(error.message);
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
    console.log(error.message);
    res.status(500).send('Internal Server Error');
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
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};




const addProduct = async (req, res) => {
  try {
    const { name, description, brand, price, category, color } = req.body;
    const images = req.files.map(file => file.filename);
    const sizes = req.body.sizes;
    const stocks = req.body.stocks;
    let message = '';

    // Check if all required fields are filled
    if (!name.trim() || !description.trim() || !brand.trim() || !price || !category || !color.trim()) {
      message = 'Please fill in all the required fields.';
      return res.status(400).render('addProducts', { message });
    }

    // Check if sizes and stocks have the same length
    if (sizes.length !== stocks.length) {
      message = 'Sizes and stocks must have the same length.';
      return res.status(400).render('addProducts', { message });
    }

    // Process the images
    const processedImages = await processImages(req.files);

    // Create an array of size-stock objects
    const sizeStocks = sizes.map((size, index) => ({ size, stock: parseInt(stocks[index]) }));

    // Create a new product instance
    const newProduct = new Product({
      name: name.trim(),
      description,
      color: color.trim(),
      brand: brand.trim(),
      oldPrice:price,
      category,
      images: processedImages,
      sizes: sizeStocks,
    });

    // Save the new product to the database
    await newProduct.save();

    console.log('Product saved successfully:', newProduct); // Log the saved product details

    res.status(200).redirect('/admin/productList');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
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
    res.status(500).send('Internal Server Error');
  }
};

//Provide the edit function.

const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, brand, price, category, color } = req.body;
    const productImages = req.files;
    const sizes = req.body.sizes; // Array of sizes from the form
    const stocks = req.body.stocks; // Array of stock counts from the form

    let message = '';

    // Validate form fields
    if (!name || !description || !brand || !price || !category || !color || !sizes || !stocks || !productImages) {
      return res.render('editProducts', {
        message: 'Please fill in all the required fields.',
        product: { _id: productId, name, description, brand, price, category, color },
        categories: await Category.find()
      });
    }

    if (!name || name.trim().length === 0 || name.trim().startsWith(' ')) {
      return res.render('editProducts', {
        message: 'Product name should not be empty or start with a space.',
        product: { _id: productId, name, description, brand, stockinCount, price, category, color },
        categories: await Category.find()
      });
    }

    // validate whether the product is unique or not
    // const existingProduct = await Product.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    // if (existingProduct) {
    //   return res.render('editProducts', {
    //     message: 'Product with the same name already exists.',
    //     product: { _id: productId, name, description, brand, stockinCount, price, category, color },
    //     categories: await Category.find()
    //   });
    // }


    if (!brand || brand.trim().length === 0 || brand.trim().startsWith(' ')) {
      return res.render('editProducts', {
        message: 'Brand should not be empty or start with a space.',
        product: { _id: productId, name, description, brand, stockinCount, price, category, color },
        categories: await Category.find()
      });
    }

    // color field validation

    if (!color || color.trim().length === 0 || color.trim().startsWith(' ')) {
      return res.render('editProducts', {
        message: 'Color should not be empty or start with a space.',
        product: { _id: productId, name, description, brand, stockinCount, price, category, color },
        categories: await Category.find()
      });
    }
    // Validate Price
    const validPrice = Number.isFinite(parseFloat(price)) && parseFloat(price) >= 0;
    if (!validPrice) {
      return res.render('editProducts', {
        message: 'Price must be a non-negative number',
        product: { _id: productId, name, description, brand, stockinCount, price, category, color },
        categories: await Category.find()
      });
    }

    

    const product = await Product.findById(productId);

    // Update product details
    product.name = name;
    product.description = description;
    product.brand = brand;
    product.price = price;
    product.category = category;
    product.color = color;

    
    if (sizes && stocks && sizes.length === stocks.length) {
      const newSizes = sizes.map((size, index) => ({
        size,
        stock: parseInt(stocks[index])
      }));
      product.sizes = newSizes;
    }

    
    if (productImages && productImages.length > 0) {
      const processedImages = await processImages(productImages);
      const existingImages = product.images || [];
      const newImages = processedImages.map(filename => `processed-${filename}`);
      product.images = [...existingImages, ...newImages];
    }

   
    await product.save();

    
    res.status(200).redirect('/admin/productList');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
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
    console.log(error.message);
    res.status(500).json({ message: 'Invalid Session Error' });
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


const loadProductOfferManagement = async(req,res)=>{
  try {
    let message = ''
    const products = await Product.find().populate('category');
    res.render('productOfferManagement', { products, message });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
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
      console.error('Error creating offer:', error);
      res.status(500).send('Error creating offer');
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
    console.error('Error activating offer:', error);
    res.status(500).send('Error activating offer');
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
    console.error('Error deactivating offer:', error);
    res.status(500).send('Error deactivating offer');
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
      console.error('Error deleting offer:', error);
      res.status(500).send('Error deleting offer');
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


