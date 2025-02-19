let mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  pinCode: String,
  country: String
});

// let Schema = mongoose.Schema;

let loginSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    // required: true
  },
  password: {
    type: String,
    // required: true
  },
  mobileNumber: {
        type: String,
        required: false,
    },
  gender: {
        type: String,
        required: false
    },
  profileImage: {
        type: String,
        required: false
  },
  googleId: {
    type: String
  },
  wallet: {
    type: Number,
    default: 0
},
  isGoogleUser: {
    type: Boolean,
    default: false
},
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'orders'
  }],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'wishlist'
  }],
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default:false,
  },
  hasShippingAddress: {
    type: Boolean,
    default: false
  },
  address: [addressSchema],
},
  {
    timestamps: true,
  }
);

let UserModel = mongoose.model('User', loginSchema);

module.exports  = UserModel;