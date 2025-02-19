const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    pinCode: String,
    country: String
})

const productSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    productName: String,
    quantity: Number,
    total: Number,
    status: {
        type: String,
        default: 'Pending'
    },
    returnReason: {
        type: String,
        default: 'not returned'
    },
});

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName:{
        type:String,
        default:true
    },
    discountPercentage: {
        type:Number,
        required:false
    },
    totalQuantity: {
        type :Number
    },
    originalPrice:{
        type: Number
    },
    totalPrice: {
        type: Number
    },
    productItems: [productSchema],
    billingAddress: [addressSchema],
    phone: {
        type: String,
        required: true
    }, 
    paymentMethod: {
        type: String,
        required: true,
        enum: ['COD', 'Razorpay', 'Wallet'],
        default: 'COD'
    },
    dateOrdered: {
        type: Date,
        default: Date.now
    }

});


module.exports = mongoose.model('Order', orderSchema);
