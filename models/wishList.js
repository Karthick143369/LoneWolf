const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userLogin',
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    }],
  
})


module.exports = mongoose.model('Wishlist', wishlistSchema);