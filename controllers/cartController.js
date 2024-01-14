const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');




const loadCartDetails = async(req,res)=>{
    try {

        let itemsInCart = [];
    let message= '';
    const menCategories = await Category.find({categoryType:'Men',isDeleted:false});
    const womenCategories = await Category.find({categoryType:'Women',isDeleted:false});
    const kidsCategories = await Category.find({categoryType:'Kids',isDeleted:false});
    const beautyCategories = await Category.find({categoryType:'beauty', isDeleted:false});
    
    const userID = req.session.user_id;

    const userCart = await Cart.findOne({ user: userID }).populate('items.product');

     itemsInCart = userCart ? userCart.items : [];

    res.render('cart',{message,menCategories,womenCategories,kidsCategories,beautyCategories,userID,itemsInCart,userCart});
    
    
    } catch (error) {
        console.log(error.message);
    }
}



const addToCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const size = req.query.size; // Assuming the size is provided as a query parameter

        // Fetch the product details from the database
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ status: false, message: 'Product not found' });
        }

        // Assuming you have a session with a user ID
        const userId = req.session.user_id; // Replace this with your session user ID

        // Find or create the user's cart
        let userCart = await Cart.findOne({ user: userId });
        if (!userCart) {
            userCart = new Cart({
                user: userId,
                items: []
            });
        }

        // Check if the product already exists in the cart with the same size
        const existingCartItem = userCart.items.find(item => String(item.product) === String(productId) && item.size === size);

        if (existingCartItem) {
            // If the product with the same size already exists, increment quantity
            existingCartItem.quantity += 1;
        } else {
            // If not, add a new item to the cart
            userCart.items.push({
                product: productId,
                size: size,
                quantity: 1,
                price: product.price // You might want to calculate the price here based on product details
            });
        }

        // Calculate total price for the cart (assuming price is stored per item)
        userCart.totalPrice = userCart.items.reduce((total, item) => total + item.price * item.quantity, 0);

        // Save the updated cart
        await userCart.save();
        if (req.xhr || req.headers.accept.indexOf('json') > -1){
            res.json({status:true});
        }else{
            res.redirect('/cart');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal Server Error' });
    }
};



const removeProduct = async (req, res) => {
    try {
        const itemId = req.params.id;
        console.log(itemId) // Access the item ID from the route parameters
        const userId = req.session.user_id; // Assuming user ID is stored in session

        // Find the user's cart based on the user ID
        const userCart = await Cart.findOne({ user: userId });

        // Check if the user's cart exists
        if (!userCart) {
            return res.status(404).json({ status: 'error', message: 'Cart not found' });
        }

        // Remove the item from the cart based on the provided item ID
        userCart.items = userCart.items.filter(item => String(item._id) !== itemId);

        // Recalculate the total price after removing the item
        userCart.totalPrice = userCart.items.reduce((total, item) => total + item.price * item.quantity, 0);

        // Save the updated cart
        await userCart.save();

        // Send a success response
        res.status(200).json({ status: 'success', message: 'Product removed from cart successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

const changeQuantity = async (req, res) => {
    try {
        const itemId = req.body.itemId;
        const quantityChange = parseInt(req.body.quantityChange);

        const userId = req.session.user_id;
        const userCart = await Cart.findOne({ user: userId });

        // Find the item in the cart and update quantity
        const item = userCart.items.id(itemId);
        if (item) {
            const originalQuantity = item.quantity;
            const newQuantity = item.quantity + quantityChange;

            // Ensure the new quantity is never less than 1
            if (newQuantity < 1) {
                return res.status(400).json({ status: 'error', message: 'Quantity cannot be less than 1' });
            }

            item.quantity = newQuantity;

            // Update item price and total price in the cart
            item.price = item.price; // If you don't want to update individual item prices

            // Update total price for the cart
            userCart.totalPrice += item.price * (newQuantity - originalQuantity);

            await userCart.save();
            
            res.status(200).json({
                status: 'success',
                quantity: item.quantity,
                price: item.price * item.quantity,
                totalPrice: userCart.totalPrice
            });
        } else {
            res.status(404).json({ status: 'error', message: 'Item not found in cart' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};











module.exports = {
    loadCartDetails,
    addToCart,
    removeProduct,
    changeQuantity
}