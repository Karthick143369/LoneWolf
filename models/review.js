const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rating: {
        type: Number,
        required: true
    },
    review: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Review', reviewSchema);