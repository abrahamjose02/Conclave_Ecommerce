const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');




const loadCartDetails = async (req, res) => {
    try {
        let itemsInCart = [];
        const menCategories = await Category.find({ categoryType: 'Men', isDeleted: false });
        const womenCategories = await Category.find({ categoryType: 'Women', isDeleted: false });
        const kidsCategories = await Category.find({ categoryType: 'Kids', isDeleted: false });
        const beautyCategories = await Category.find({ categoryType: 'beauty', isDeleted: false });
        const userID = req.session.user_id;
        const userCart = await Cart.findOne({ user: userID }).populate('items.product');
        let message = req.session.message || '';
        
        if (req.session.message && !req.session.message.fromRedirect) {
            req.session.message = null;
        }
        
        itemsInCart = userCart ? userCart.items : [];
        
        let hasOutOfStock = false; // Flag to track if any out-of-stock item is present
        
        // Check stock availability and mark items out of stock
        for (const item of itemsInCart) {
            const product = item.product;
            const size = item.size;
            const productSize = product.sizes.find(s => s.size === size);
            
            if (!productSize || productSize.stock < item.quantity) {
                item.outOfStock = true; // Set outOfStock to true if not enough stock
                hasOutOfStock = true; // Set flag to true if any item is out of stock
            } else {
                item.outOfStock = false; // Otherwise, set outOfStock to false
            }
        }
        
        // Clear message if no out-of-stock items are present
        if (!hasOutOfStock) {
            req.session.message = null;
        }
        
        res.render('cart', {
            message: req.session.message,
            menCategories,
            womenCategories,
            kidsCategories,
            beautyCategories,
            userID,
            itemsInCart,
            userCart
        });

    } catch (error) {
        console.error(error);
        res.status(500).render('404');
    }
}




const addToCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const size = req.query.size; 

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ status: false, message: 'Product not found' });
        }

        const userId = req.session.user_id;

        let userCart = await Cart.findOne({ user: userId });
        if (!userCart) {
            userCart = new Cart({
                user: userId,
                items: []
            });
        }

        const existingCartItem = userCart.items.find(item => String(item.product) === String(productId) && item.size === size);

        if (existingCartItem) {
            existingCartItem.quantity += 1;
        } else {
            userCart.items.push({
                product: productId,
                size: size,
                quantity: 1,
                price: product.price,
            });
        }

        userCart.totalPrice = userCart.items.reduce((total, item) => total + item.price * item.quantity, 0);

        await userCart.save();

        // Send response based on request type
        if (req.xhr || req.headers.accept.indexOf('json') > -1){
            res.json({ status: true });
        } else {
            res.redirect('/cart');
        }
    } catch (error) {
        console.error(error);
    res.status(500).render('404');
    }
};




const removeProduct = async (req, res) => {
    try {
        const itemId = req.params.id;
        console.log(itemId) 
        const userId = req.session.user_id; 

        
        const userCart = await Cart.findOne({ user: userId });

       
        if (!userCart) {
            return res.status(404).json({ status: 'error', message: 'Cart not found' });
        }

        
        userCart.items = userCart.items.filter(item => String(item._id) !== itemId);

       
        userCart.totalPrice = userCart.items.reduce((total, item) => total + item.price * item.quantity, 0);

        
        await userCart.save();

        
        res.status(200).json({ status: 'success', message: 'Product removed from cart successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).render('404');
    }
};

const changeQuantity = async (req, res) => {
    try {
        const itemId = req.body.itemId;
        const quantityChange = parseInt(req.body.quantityChange);

        const userId = req.session.user_id;
        const userCart = await Cart.findOne({ user: userId });

        
        const item = userCart.items.id(itemId);
        if (item) {
            const originalQuantity = item.quantity;
            const newQuantity = item.quantity + quantityChange;

            
            if (newQuantity < 1) {
                return res.status(400).json({ status: 'error', message: 'Quantity cannot be less than 1' });
            }

            item.quantity = newQuantity;

          
            item.price = item.price; 

            
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
    res.status(500).render('404');
    }
};











module.exports = {
    loadCartDetails,
    addToCart,
    removeProduct,
    changeQuantity
}