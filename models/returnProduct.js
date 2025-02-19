const mongoose = require('mongoose');

const returnProduct  = new mongoose.Schema({
    orderId : {
        type:mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'
    },
    productId : {
        type:mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'product'
    },
    returnReason : {
        type: String,
        required : true
    },
    status:{
        type:String,
        default: 'Pending'
    }
});

module.exports = mongoose.model('ReturnRequest', returnProduct);