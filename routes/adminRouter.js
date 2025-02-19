const express = require("express");
const adminRouter = express.Router();
const adminController = require("../controller/adminDashBoard");
const Swal = require('sweetalert2')
const { isAdminValid, isNotAdminValid, isAdmin } = require("../middlewares/validation");
const categoryController = require("../controller/CategoryController");
const brandController = require("../controller/brandController");
const brandModel = require("../models/brand");
const dashboardController = require("../controller/dashboardController");
const couponController = require('../controller/couponController');

//HomeLogin Route
adminRouter.get('/', isAdminValid, adminController.adminRoute);

adminRouter.get('/products', (req, res) => {
  res.render('admin/admin-product');
});

adminRouter.get('/add-product', (req, res) => {
  res.render('admin/add-product');
});

// adminRouter.get('/category', (req, res) => {
//   res.render('admin/admin-category');
// });



adminRouter.get('/logout', (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
      res.send("Error");
    } else {
      res.clearCookie('connect.sid');
      res.redirect('/admin');
      // req?.session?.destroy();
    }
  })
});


adminRouter.get('/add-category', (req, res) => {
    res.render('admin/add-category');

});





// admin controller User Routes
// adminRouter.get('/block/:id', adminController.blockuser);
// adminRouter.get('/unblock/:id', adminController.unBlockuser);
adminRouter.post('/block-unblock-user/:id', adminController.blockOrUnblockUser);

//DashBoard Route
adminRouter.post('/login', isAdminValid, adminController.homePostRoute);
adminRouter.get('/dashboard', isNotAdminValid, adminController.dashboardRoute);
adminRouter.get('/dashboard2', isNotAdminValid, dashboardController.dashboard);


//controlling category management
adminRouter.get('/category', isNotAdminValid, categoryController.category);
adminRouter.post('/categoryAdd', isNotAdminValid, categoryController.categoryAdd);
adminRouter.get('/deleteCategory/:id', isNotAdminValid, categoryController.deleteCategory);
adminRouter.get('/editCategory/:id', isNotAdminValid, categoryController.editCategory);
adminRouter.put('/editCategory/:id', isNotAdminValid, categoryController.editCategoryAction);
adminRouter.get('/block/:id',isNotAdminValid,categoryController.blockCategory);
adminRouter.get('/unblock/:id', isNotAdminValid, categoryController.unblockCategory);


//routes handling brand management
adminRouter.get('/add-category', isAdmin, brandController.getBrand);
adminRouter.post('/brandAdd',isNotAdminValid, brandController.brandAdd);
adminRouter.get('/editBrand/:id',isNotAdminValid, brandController.editBrand);
adminRouter.put('/editBrand/:id',isNotAdminValid, brandController.editBrandAction);
adminRouter.get('/deleteBrand/:id', isNotAdminValid, brandController.deleteBrand);


adminRouter.get('/orders', dashboardController.chartUpdate);


//routes for coupon management
adminRouter.get('/coupons', couponController.couponList);
adminRouter.get('/addCoupons', couponController.addCoupon);
adminRouter.post('/addCoupons', couponController.createCoupon);
adminRouter.delete('/deleteCoupon/:id', couponController.deleteCoupon);
adminRouter.get('/editCoupon/:id',  couponController.editCoupon);
adminRouter.post('/editCoupon/:id',couponController.updateCoupon);

// category offer management
adminRouter.get('/categoryOffer',categoryController.categoryOfferList);
adminRouter.get('/categoryOffer/add',categoryController.categoryOfferUpdatePage);
adminRouter.post('/categoryOffer/post',categoryController.addCategoryOffer);
adminRouter.delete('/categoryOffer/delete/:id',categoryController.deleteCategoryOffer);
adminRouter.get('/categoryOffer/edit/:id',categoryController.editCategoryOfferPage);
adminRouter.post('/categoryOffer/update/:id',categoryController.editCategoryOffer);


// dashboard managements
adminRouter.get('/dashboard',  dashboardController.dashboard);
adminRouter.get('/orders',dashboardController.chartUpdate);
adminRouter.get('/reports',  dashboardController.salesReport);

module.exports = adminRouter;

