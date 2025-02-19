const mongoose = require('mongoose');

const productOfferSchema = new mongoose.Schema({
    products: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    },
    offerName: {
        type: String,
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
    }
});

// Create a TTL index on the `endDate` field
productOfferSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model('ProductOffer', productOfferSchema);
