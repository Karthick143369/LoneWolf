const mongoose = require('mongoose');

const categoryOfferSchema = new mongoose.Schema({
    categories: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
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
        // default: Date.now,
        required: true,
    }
});

// Create a TTL index on the expiryDate field
categoryOfferSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model('CategoryOffer', categoryOfferSchema);
