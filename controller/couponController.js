const UserModel = require('../models/User');
const couponModel = require('../models/coupon')
const orderModel = require('../models/order');



// show coupons list
const couponList = async (req, res) => {
    try {

        const coupons = await couponModel.find();
        const couponUpdate = coupons.map(coupon => ({
            ...coupon._doc,
            expiryDate: coupon.expiryDate.toISOString().split('T')[0]
        }));
        res.render('admin/coupons', { coupons: couponUpdate });

    } catch (error) {
        console.log('Some error occured in coupon:', error);
        res.render('admin/coupons', { error: 'some error in coupon list.' });
    }
}

//rendering coupon adding page
const addCoupon = async (req, res) => {
    res.render('admin/addCoupon', { coupon: {}, editMode: false })
}

//coupon editing page
const editCoupon = async (req, res) => {
    const couponId = req.params.id;
    const coupon = await couponModel.findById(couponId);
    if (!coupon) {
        req.flash('error', 'coupon is not found.');
        res.redirect('/admin/coupons');
    } else {
        res.render('admin/addCoupon', { coupon, editMode: true })
    }
}


//updating coupon
const updateCoupon = async (req, res) => {
    try {
        const id = req.params.id;
        const { couponName, couponCode, startDate, expiryDate, discountPercentage, maxDiscount, maxAmount } = req.body;
        if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 90) {
            req.flash('error', 'Discount percentage must be a number between 0 and 90.');
            return res.redirect(`/admin/editCoupon/${id}`); 
        }
        const expiryDateObj = new Date(expiryDate);
        console.log('expriry date:',expiryDateObj)
        if(expiryDateObj<Date.now()){
        req.flash('error', 'expiry date should be more than today.');
        return res.redirect('/admin/addcoupons');
    }
        //update category fields
        const updatedCoupon = await couponModel.findByIdAndUpdate(id, {
            couponName,
            couponCode,
            startDate,
            expiryDate,
            discountPercentage,
            maxDiscount,
            maxAmount
        }, { new: true });

        if (!updatedCoupon) {
            req.flash('error', 'coupon not found.');
            return res.redirect('/admin/coupons')
        }

        req.flash('success', 'successfully edited the coupon.')
        res.redirect('/admin/coupons')
    } catch (error) {
        console.log('editing coupon:', error.message);
        req.flash('error', 'An error occured while editing the coupon');
        res.redirect('/admin/coupons')
    }

}

// adding new coupon
const createCoupon = async (req, res) => {
    const { couponName, couponCode, startDate, expiryDate, discountPercentage, maxDiscount,maxAmount } = req.body;
    if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 90) {
        req.flash('error', 'Discount percentage must be a number between 0 and 90.');
        return res.redirect('/admin/addcoupons');
    }
    const expiryDateObj = new Date(expiryDate);
    console.log('expriry date:',expiryDateObj)
    if(expiryDateObj<Date.now()){
        req.flash('error', 'expiry date should be more than today.');
        return res.redirect('/admin/addcoupons');
    }
    try {
        const newCoupon = new couponModel({
            couponName,
            couponCode,
            startDate,
            expiryDate,
            discountPercentage,
            maxDiscount,
            maxAmount
        });

        await newCoupon.save();
        req.flash('success', 'coupon added successfully.')
        res.redirect('/admin/coupons'); 
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error adding coupon.');
        res.redirect('/admin/addcoupons');
    }

}

// delete one coupon
const deleteCoupon = async (req, res) => {
    try {
        const coupon = await couponModel.findByIdAndDelete(req.params.id)
        if (!coupon) {
            res.status(400).json({error: 'coupon not find.'})
        }
        res.status(200).json({success: 'coupon deleted successfuly'})
    } catch (error) {
        console.log("delete coupon error:", error.message);
        res.status(400).json({error: 'error in coupon deleting.'})
    }
}


//showing coupons showing page
const couponPage = async(req, res) => {
    try {
        if (req.session.isUser) {

            const currentDate = new Date();
            const coupons = await couponModel.find({
                startDate: { $lte: currentDate }
            });

            const user = req.session.isUser
            const userData = await UserModel.findOne({ name: user });
            const userId = userData._id.toString();
            res.render('user/coupon',{coupons ,userData: userData, userId });


        }

    } catch (error) {
        console.log('error in coupon listing:',error.message);
    }
}

//validate if coupon is applicable for the user
const applyCoupon = async(req, res) => {
    try {
        const userId = req.session.userId;
        const { couponCode, totalAmount } = req.body;
        const coupons = await couponModel.findOne({ couponCode: couponCode });
        if(coupons){
            if(totalAmount  >= coupons.maxAmount){
                const discountAmount = Math.floor(totalAmount*(coupons.discountPercentage/100));
                const newTotal = totalAmount-discountAmount;

                res.status(200).json({success:'coupon added successfully',discountAmount, newTotal});
        
            }else{
                console.log('coupon code not matching');
                return  res.status(400).json({error: 'coupon code is not applicable to you.'});
        
            }
        }else{
            console.log('coupon code not matching');
            return  res.status(400).json({error: 'coupon code is not matching.'});
        }
      
    } catch (error) {
        console.log('error in applying coupon');
    }
}



module.exports = {
    couponList,
    addCoupon,
    createCoupon,
    deleteCoupon,
    editCoupon,
    updateCoupon,
    couponPage,
    applyCoupon
}

