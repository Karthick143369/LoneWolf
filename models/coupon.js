const mongoose = require('mongoose');


const couponSchema = new mongoose.Schema({
  couponName: {
    type: String,
    required: true
  },
  couponCode: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: false
  },
  expiryDate: {
    type: Date,
    required: true,

  },
  discountPercentage: {
    type: Number,
    required: false
  },
  maxDiscount: {
    type: String,
    required: false
  },
  maxAmount:{
    type: Number,
    required: true
  }
})


// Create a TTL index on the expiryDate field
couponSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model('coupons', couponSchema)
