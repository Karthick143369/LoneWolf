const failedOrderModel = require('../models/failedOrder');
const orderModel = require('../models/order');
const productModel = require('../models/product');
const Razorpay = require('razorpay');

// create a instance for razopay
const razorpay  = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});


// showing failed orders page
const failedPaymentPage = async(req,res) => {
    try {
        const userId = req.session.userId;
        const failedOrder = await failedOrderModel.find({userId}).populate('productItems.productId').sort({ dateOrdered: -1 });;
        res.render('user/failedOrder',{failedOrder})
    } catch (error) {
        console.log('failedOrderpage:',error);
    }
}


const retryPayment = async(req, res) =>{
    try {
        const userId = req.session.userId;
        const {orderId} = req.body;
        const failedOrder = await failedOrderModel.findById(orderId).populate('productItems.productId');
      
        if(!failedOrder){
            return res.status(400).json({error: 'This failed order is not exist'})
        }
       
        const razorpayOrder = await razorpay.orders.create({
            amount: failedOrder.totalPrice * 100, // Amount in paise
            currency: 'INR',
            receipt: orderId
        });

        res.json({
            success: true,
            key_id: razorpay.key_id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            order_id: razorpayOrder.id
        });
    } catch (error) {
        console.log('retry payment error:',error);
        res.status(500).json({ success: false, message: error.message });
    }
}

const repaymentSuccess = async(req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        const failedOrder = await failedOrderModel.findById(orderId).populate('productItems.productId');
        if (!failedOrder) {
            return res.status(404).json({ success: false, message: 'Failed order not found' });
        }

        const newOrder = new orderModel({
                userId: failedOrder.userId,
                productItems: failedOrder.productItems,
                billingAddress: failedOrder.billingAddress,
                phone: failedOrder.phone,
                paymentMethod: failedOrder.paymentMethod,
                totalPrice: failedOrder.totalPrice,
                userName: failedOrder.userName,
                originalPrice: failedOrder.originalPrice,
                couponDiscount: failedOrder.couponDiscount
        })
        await newOrder.save();
            for (const item of failedOrder.productItems) {
                await productModel.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );
            }
            res.status(200).json({success: true, successes: 'Order placed successfully'});
            await failedOrderModel.findByIdAndDelete(orderId); 
    } catch (error) {
        console.log('repayment success:',error);
        res.status(400).json({ error: 'Error in placing razorpay.' })
    }
}

module.exports ={
    failedPaymentPage,
    retryPayment,
    repaymentSuccess
}