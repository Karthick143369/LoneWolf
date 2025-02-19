const express = require("express");
const userController = require("../controller/userRegisterCtrl");
const { isValid, isNotVaid,isLogout,isBlock } = require("../middlewares/validation");
const passport = require("passport");
const  googleAuth = require("../controller/GoogleAuthController");
const categoryController = require('../controller/userCategory');
const Product = require("../models/product");
const { signupValidator } = require("../helpers/userValidate");
const userProfileController = require('../controller/userProfileController');
const cartController = require('../controller/cartController');
const checkoutController = require('../controller/checkoutController');
const orderController = require('../controller/orderController');
const reviewController = require('../controller/reviewController');
const forgotPassController = require("../controller/fogotPassController");
const couponController = require('../controller/couponController');
const failedOrderController = require('../controller/failedOrderController');
const wishListController = require('../controller/wishListController');
const upload = require('../helpers/userMulter')


const multer = require('multer');
const uploadForm = multer(); 

let UserRoute = express.Router();

//HOME  

UserRoute.get('/login-page', isValid,(req, res) => {
  res.render('user/login-page');
});
UserRoute.get('/sign-up',isValid, (req, res) => {
  res.render('user/signup-page');
});


//user validation routes
// UserRoute.post('/register', isValid, userController.userRegistercntrl);
UserRoute.get('/',isBlock,userController.homeRoute);
UserRoute.post('/signup',isValid,signupValidator,userController.signupAction);//signup and otp send
UserRoute.post('/login', isValid, userController.loginAction);
UserRoute.get('/logout',userController.logout)
UserRoute.get('/otp', userController.otpPage);
UserRoute.post('/verifyOtp', userController.verifyOtp);
UserRoute.get('/resendOtp',userController.resendOtp); 




//google signup
UserRoute.get('/auth/google',passport.authenticate('google',{
  scope: ['email','profile'],
  prompt: 'select_account'
}));    

UserRoute.get('/auth/google/callback', passport.authenticate('google', {
  scope:['profile','email'],
  failureRedirect: '/failure'
}), googleAuth.successGoogleLogin);

UserRoute.get('/failure',googleAuth.failureGoogleLogin)


//product filtering
UserRoute.get('/category',categoryController.categoryPage);
UserRoute.get('/filter',categoryController.productFilter);
UserRoute.get('/search',categoryController.searchProduct);




// Product detail route
UserRoute.get('/product/:id',isBlock, async (req, res) => {
  try {
      const productId = req.params.id;

      // Fetch the product by ID
      const product = await Product.findById(productId).populate('brand', 'name') // Assuming brand schema has 'name'
      .populate('category', 'name');

      if (!product) {
          return res.status(404).send('Product not found');
      }
        // Fetch similar products (same category, excluding the current product)
        const similarProducts = await Product.find({
          category: product.category,
          _id: { $ne: product._id }, // Exclude the current product
        }).limit(4); // Limit to 4 similar products
    

      res.render('user/productDetail', { product,similarProducts });
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});

// Add to Cart route (POST request)
// UserRoute.post('/cart', (req, res) => {
//   const { productId, quantity } = req.body;

//   // Example: Handle the cart logic
//   // Here you can add the product to the cart database/session
//   console.log(`Product ID: ${productId}, Quantity: ${quantity}`);

//   res.redirect(`/product/${productId}`); // Redirect back to product detail page
// });


// UserRoute.get('/profile', userProfileController.profilePage);


//user profile details
UserRoute.get('/profile',userProfileController.profilePage);
UserRoute.post('/profile/:id',upload.single('profileImage'),userProfileController.profileUpdate);
UserRoute.get('/password',userProfileController.changePasswordPage);
UserRoute.post('/password/:id',userProfileController.changePass);

//cart controller routes
UserRoute.get('/cart',isBlock,cartController.cartPage);
UserRoute.post('/cart',cartController.addToCart);
UserRoute.delete('/deleteCart/:id',cartController.deleteCart);
UserRoute.post('/updateQuantity', cartController.updateQuantity);
UserRoute.get('/getCartCount', cartController.getCartCount);






//chekout order 
UserRoute.get('/checkout',checkoutController.checkoutPage);
UserRoute.post('/checkout/mobile',checkoutController.checkoutPageMobile);
UserRoute.post('/checkout/address',uploadForm.none(),checkoutController.checkoutAddressAdd);
UserRoute.post('/checkout/address/edit', uploadForm.none(),checkoutController.checkoutAddressEdit);

//ordering Product
UserRoute.post('/checkout/order', orderController.placeOrder);
UserRoute.post('/checkout/payment',orderController.paymentOrder);
UserRoute.post('/checkout/failedPayment',orderController.failedPayment);
UserRoute.get('/confirmation', orderController.confirmation);

// failed order management
UserRoute.get('/failed/payment',failedOrderController.failedPaymentPage);
UserRoute.post('/retryPayment',failedOrderController.retryPayment);
UserRoute.post('/repaymentSuccess',failedOrderController.repaymentSuccess);

// forgot password routes
UserRoute.get('/forgotPass',forgotPassController.forgotPassword);
UserRoute.post('/forgotPass/email',forgotPassController.forgotPasswordEmail);
UserRoute.get('/forgotOtp',forgotPassController.otpPage);
UserRoute.get('/forgotPass/resendOtp',forgotPassController.resendOtp); 
UserRoute.post('/forgotPass/verifyOtp',forgotPassController.verifyOtp);
UserRoute.post('/forget/changePass',forgotPassController.changePassword);


//order management
UserRoute.get('/orders',isBlock,orderController.orderList);
UserRoute.get('/orders/:orderId',orderController.orderDetails);
UserRoute.get('/order/cancel/:orderId/:productId',orderController.orderCancel);
UserRoute.post('/order/return',orderController.returnProduct);
UserRoute.get('/order/downloadInvoice/:orderId/:productId', orderController.downloadInvoice);

// reviewing a product
UserRoute.post('/review',reviewController.reviewProduct);

// coupon management
UserRoute.get('/coupons',isBlock,couponController.couponPage);
UserRoute.post('/applyCoupon',couponController.applyCoupon);


// wish list
UserRoute.get('/wishList',isBlock,wishListController.wishList);
UserRoute.post('/wish',wishListController.wishProduct);
UserRoute.delete('/wish/delete/:id', wishListController.deleteWish);


//product filtering
UserRoute.get('/category',categoryController.categoryPage);
// UserRoute.get('/filter',categoryController.productFilter);
// UserRoute.get('/search',categoryController.searchProduct);


UserRoute.get('/wallet',isBlock,userProfileController.walletPage);
UserRoute.post('/wallet/addFund', isValid, userProfileController.addFund);


//side Profile 
UserRoute.get('/sideProfile', userProfileController.sideProfile);



// Add this to your routes file
UserRoute.post('/checkCartItem', async (req, res) => {
  try {
      const { productId } = req.body;
      const userId = req.session.userId; // Or however you store user ID
      
      const cartItem = await Cart.findOne({
          userId,
          'products.productId': productId
      });

      if (cartItem) {
          const product = cartItem.products.find(p => p.productId.toString() === productId);
          res.json({
              exists: true,
              currentQuantity: product.quantity
          });
      } else {
          res.json({
              exists: false,
              currentQuantity: 0
          });
      }
  } catch (error) {
      res.status(500).json({ error: 'Server error' });
  }
});



// Add Address Route
UserRoute.get('/add-address', (req, res) => {
  res.render('add-address'); // Render the add address form
});

// Edit Address Route
UserRoute.get('/edit-address/:id', (req, res) => {
  const addressId = req.params.id;
  // Fetch address details and render the edit address form
  res.render('edit-address', { address: addressDetails });
});

// Delete Address Route
UserRoute.delete('/delete-address/:id', async (req, res) => {
  const addressId = req.params.id;
  try {
      // Delete address from the database
      await AddressModel.findByIdAndDelete(addressId);
      res.status(200).send('Address deleted successfully');
  } catch (error) {
      res.status(500).send('Error deleting address');
  }
});

module.exports = UserRoute;


