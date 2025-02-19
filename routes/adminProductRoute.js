const express = require('express');
const productRouter = express.Router();
const adminProductController = require('../controller/adminProductController');
const { isAdminValid, isNotAdminValid, isAdmin } = require("../middlewares/validation");
const upload = require('../helpers/productMulter')
const { addProductValidator } = require('../helpers/productValidater')
const adminOrderController = require('../controller/adminOrderController');
const offerController = require('../controller/offerController');




//admin routes
productRouter.get('/addProduct',isNotAdminValid,adminProductController.addProduct);
productRouter.post('/addProduct', upload.array('images', 10), addProductValidator, adminProductController.addProductAction);
// productRouter.post('/addProduct', upload.array('images', 10),adminProductController.addProductAction);
productRouter.get('/productList',isNotAdminValid,adminProductController.productList);
productRouter.get('/editProduct/:id',isNotAdminValid,adminProductController.editPage);
productRouter.post('/editProduct/:id',upload.array('images',10),adminProductController.updateProduct);
productRouter.delete('/deleteImage/:id',upload.array('images',10),adminProductController.deleteImage);

productRouter.get('/block/:id',isNotAdminValid,adminProductController.blockProduct);
productRouter.get('/unblock/:id', isNotAdminValid, adminProductController.unblockProduct);

productRouter.get('/orderList',isNotAdminValid,adminOrderController.orderList);
productRouter.post('/orderStatus',isNotAdminValid,adminOrderController.orderStatus);
productRouter.get('/view/:orderId/:productId',isNotAdminValid,adminOrderController.viewOrder);
productRouter.get('/return/:orderId/:productId',isNotAdminValid,adminOrderController.returnManagement);
productRouter.post('/return/:orderId/:productId/accept',isNotAdminValid,adminOrderController.acceptReturn);
productRouter.post('/return/:orderId/:productId/reject',isNotAdminValid,adminOrderController.rejectReturn);
productRouter.post('/return/:orderId/:productId/returned',isNotAdminValid,adminOrderController.productReturned);

// product offer management
productRouter.get('/offerList',offerController.productOfferList);
productRouter.get('/addOffer/:id',offerController.addProductOfferPage);
productRouter.post('/saveOffer/:id',offerController.addProductOffer);
productRouter.delete('/offer/delete/:id',offerController.deleteProductOffer);
productRouter.get('/editOffer/:id',offerController.editProductOfferPage);
productRouter.post('/offer/update/:id',offerController.editProductOffer);

module.exports =productRouter;