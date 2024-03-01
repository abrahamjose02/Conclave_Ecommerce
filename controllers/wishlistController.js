const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');


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

  const loadWishlist = async (req, res) => {
    try {
        let message = '';
        const menCategories = await getCategoryiesByType('Men');
        const womenCategories = await getCategoryiesByType('Women');
        const kidsCategories = await getCategoryiesByType('Kids');
        const beautyCategories = await getCategoryiesByType('Beauty');

        const userID = req.session.user_id;

        console.log('UserID:', userID);

        const wishlist = await Wishlist.findOne({ user: userID }).populate('items.product');

        console.log('Wishlist:', wishlist);

        res.render('wishlist', {
            wishlist,
            menCategories,
            womenCategories,
            kidsCategories,
            beautyCategories,
            userID,
            message,
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('404');
    }
};



const addToWishlist = async (req, res) => {
    try {
        const productId = req.params.productId;
        const size = req.query.size || 'XS'; 

        console.log('Adding to wishlist:', productId, size); // Debugging: Log productId and size

        if (!req.session.user_id) {
            return res.status(403).json({ status: false, message: 'User not logged in' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ status: false, message: 'Product not found' });
        }

        const selectedSize = product.sizes.find(s => s.size === size);
        if (!selectedSize) {
            return res.status(400).json({ status: false, message: 'Selected size not available for this product' });
        }

        // Check if the product is already in the wishlist
        const existingWishlistItem = await Wishlist.findOne({
            user: req.session.user_id,
            'items.product': productId,
            'items.size': size,
        });

        if (existingWishlistItem) {
            return res.status(409).json({ status: false, message: 'Product already in wishlist' });
        }

        const wishlistItem = {
            product: productId,
            size: size,
            quantity: 1,
        };

        let wishlist = await Wishlist.findOneAndUpdate(
            { user: req.session.user_id },
            { $push: { items: wishlistItem } },
            { new: true, upsert: true }
        );

        console.log('Wishlist after adding:', wishlist); // Debugging: Log updated wishlist

        res.status(201).json({ status: true, message: 'Product added to wishlist', wishlist: wishlist });
    } catch (error) {
        console.error(error);
    res.status(500).render('404');
    }
};


const removeProduct = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const wishlistId = req.params.wishlistId; // Updated to wishlistId
        const productId = req.params.productId;

        const updateWishlist = await Wishlist.findOneAndUpdate(
            { user: userId, _id: wishlistId }, // Filter by user and wishlistId
            { $pull: { items: { product: productId } } },
            { new: true }
        ).populate('items.product');

        if (!updateWishlist) {
            return res.json({ status: false, message: 'Product not found in wishlist' });
        }

        res.json({ status: true, message: 'Product removed from wishlist', updatedWishlist: updateWishlist });
    } catch (error) {
        console.error(error);
    res.status(500).render('404');
    }
};


// to remove the product when it is added to the cart   

const removeProductFromWishlisttoAddtoCart = async (req, res) => {
    try {
        // Check if the user is logged in
        if (!req.session.user_id) {
            return res.status(403).json({ status: false, message: 'User not logged in' });
        }

        const userId = req.session.user_id;
        const productId = req.params.productId;

        // Update the wishlist by removing the specified product
        const updateWishlist = await Wishlist.findOneAndUpdate(
            { user: userId, 'items.product': productId },
            { $pull: { 'items': { product: productId } } },
            { new: true }
        ).populate('items.product');

        // Check if the update was successful
        if (!updateWishlist) {
            return res.json({ status: false, message: 'Product not found in wishlist' });
        }

        // Return the updated wishlist data to the client
        res.json({ status: true, message: 'Product removed from wishlist', updatedWishlist: updateWishlist });
    } catch (error) {
        console.error(error);
        res.status(500).render('404');
    }
};





module.exports = {
    loadWishlist,
    addToWishlist,
    removeProduct,
    removeProductFromWishlisttoAddtoCart
}

