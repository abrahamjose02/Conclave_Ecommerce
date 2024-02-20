
const Coupon = require('../models/couponModel');
const { findByIdAndDelete } = require('../models/userModel');
const User = require('../models/userModel');
const Cart = require('../models/cartModel');



const loadCouponList = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        let message = req.session.message || '';

        res.render('couponList', { coupons: coupons, message });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Invalid Session Error" });
    }
}

const loadAddCoupon = async (req, res) => {
    try {
        let message ='';
        res.render('addCoupon', { message })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Invalid Session Error' });
    }
}


const addCoupon = async(req,res)=>{
    try {
        const{name,code,min_bill,cap,discount,expire}= req.body;

        const newCoupon = new Coupon({
            name,
            code,
            min_bill,
            cap,
            discount,
            expire
        })

        const currentDate = new Date();

        if(newCoupon.expire < currentDate){
            newCoupon.status = 'expired';
        }

        await newCoupon.save();

        res.redirect('/admin/couponList');
        
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


const loadEditCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;

        const coupon = await Coupon.findById(couponId);
        let message = req.session.message || '';
        res.render('editCoupon', { coupon, message });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Invalid Session Error' })
    }
}

const editCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        const{name,code,min_bill,cap,discount,expire}= req.body;

        const coupon = await Coupon.findById(couponId)

        if (!coupon) {
            return res.status(400).render('editCoupon', { message: 'Coupon not found' });
        }

        if (!name || name.trim() === '') {
            return res.status(400).render('editCoupon', { message: 'Name should not be empty and should not start with space' });
        }


        if (!min_bill || isNaN(min_bill) || min_bill <= 0) {
            return res.status(400).render('editCoupon', { message: 'Invalid Bill Amount' })
        }

        if (!cap || isNaN(cap) || cap <= 0) {
            return res.status(400).render('editCoupon', { message: 'Invalid Cap Amount' })
        }

        if (!code || code.trim() === '') {
            return res.status(400).render('editCoupon', { message: 'code should not be empty and should not start with space' });
        }

        if (!discount || isNaN(discount) || discount < 0 || discount > 100) {
            return res.status(400).render('editCoupon', { message: 'Invalid Discount Percentage' })
        }
        if (!expire) {
            return res.status(400).render('editCoupon', { message: 'Invalid Expiry Date' });
        }
        if (name.toLowerCase() !== coupon.name.toLowerCase()) {
            const existingCoupon = await Coupon.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
            if (existingCoupon) {
                return res.status(400).render('editCoupon', { message: 'Coupon Name already exists', coupon })
            }

        }

        coupon.name = name;
        coupon.code = code;
        coupon.min_bill = min_bill;
        coupon.cap = cap;
        coupon.discount = discount;
        coupon.expire = expire;

        await coupon.save();

        res.redirect('/admin/couponList');

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Invalid Session Error' });
    }
}

const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;

        const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

        if (!deletedCoupon) {
            return res.status(400).json({ message: 'Coupon not deleted' })
        }

        res.redirect('/admin/couponList');

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Invalid Session Error' });
    }
}


const applyCoupon = async (req, res) => {
    try {
        const userID = req.session.user_id;
        const userCart = await Cart.findOne({ user: userID }).populate('items.product');
        const cart = userCart ? userCart.items : [];
        const couponCode = req.body.code;

        const couponDet = await Coupon.findOne({ code: couponCode, used_user: { $nin: [userID] } });

        if (couponDet) {
            const currentDate = new Date();
            const expirationDate = new Date(couponDet.expire);

            if (expirationDate.getTime() < currentDate.getTime()) {
                return res.json({ success: false, expired: true, message: 'Coupon has expired' });
            }

            if (userCart.totalPrice > couponDet.min_bill) {
                const discountPercentage = couponDet.discount;
                const discount = Math.round(userCart.totalPrice * (discountPercentage / 100));
                const maxDiscount = Math.round(Math.min(discount, couponDet.cap));
                const total = userCart.totalPrice - maxDiscount;

                req.session.couponDetails = {
                    couponCode: couponCode,
                    discount: maxDiscount,
                    newTotal: total,
                };

                await couponDet.updateOne({ $addToSet: { used_user: userID } });

                return res.json({
                    success: true,
                    message: 'Coupon applied successfully',
                    newTotal: total,
                    discount: maxDiscount,
                });
            } else {
                return res.json({
                    success: false,
                    notapplicable: true,
                    message: 'Coupon not applicable for the current cart total',
                });
            }
        } else {
            return res.json({ success: false, message: 'Invalid coupon code or already applied' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const removeCoupon = async (req, res) => {
    try {
        const userID = req.session.user_id;
        const userCart = await Cart.findOne({ user: userID });

        if (!userCart) {
            return res.json({ success: false, message: 'User cart not found' });
        }

        const couponCode = req.session.couponDetails ? req.session.couponDetails.couponCode : null;

        if (!couponCode) {
            return res.json({ success: false, message: 'No coupon applied' });
        }

        // Check if the coupon code is valid
        const couponDet = await Coupon.findOne({ code: couponCode });

        if (couponDet) {
            // Remove the user from the used_user array for this coupon using $pull
            await couponDet.updateOne({ $pull: { used_user: userID } });

            req.session.couponDetails = {
                couponCode: null, 
                discount: 0,      
                newTotal: userCart.totalPrice || 0,
            };

            return res.json({ success: true, message: 'Coupon removed successfully' });
        } else {
            // If the coupon code is invalid, send a message
            return res.json({ success: false, message: 'Invalid coupon code' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};





module.exports = {
    loadCouponList,
    loadAddCoupon,
    addCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon,
    applyCoupon,
    removeCoupon
}