const productModel = require('../models/product');
const productOfferModel = require('../models/productOffer');



// showing product list
const productOfferList = async(req, res) => {
    try {
        const products = await productModel.find().populate('offer');
        const productOff = await productOfferModel.find().populate('products');
        res.render('admin/productOfferList', { products: products ,productOff});
    } catch (error) {
        console.error("Error in getting product list:", error);
        res.render("admin/productOfferList");
    }
}
// product offer adding page
const addProductOfferPage = async(req, res) =>{
    try {
        const id = req.params.id;
        const product = await productModel.findById(id)
        res.render('admin/addProductOffer',{product:product})
    } catch (error) {
        console.log('product offer adding page:',error.message);
    }
}

// product offer is updating by posting it
const addProductOffer = async(req, res) => {
    try {
        const productId= req.params.id;
        const {offerName,discountPercentage,startDate,endDate } = req.body
        const product = await productModel.findById(productId);
        if (isNaN(discountPercentage) || discountPercentage < 1 || discountPercentage > 90) {
            req.flash('error', 'Discount percentage must be a number between 1 and 90.');
            return res.redirect(`/admin/product/addOffer/${productId}`); 
        }
        const productOffer = new productOfferModel({
            products:productId,
            offerName,
            discountPercentage,
            startDate,
            endDate
        })
        const savedOffer  = await productOffer.save();

          // Update the product with the new offer reference
          const productSchemaUpdate = await productModel.findByIdAndUpdate(
            productId,
            { offer: savedOffer._id },
            { new: true }
        );

       
        res.redirect('/admin/product/offerList')
    } catch (error) {
        console.log('some errors in adding product offer:',error.message);
    }
}

// deleting a product offer
const deleteProductOffer = async(req, res) => {
    try {
        const productId = req.params.id;
        const ProductOffer = await productOfferModel.findByIdAndDelete(productId);
        if(!ProductOffer){
            return res.status(400).json({error:'No product offer found'});
        }
        res.status(200).json({success:'Your product offer deleted.'});
    } catch (error) {
       console.log('error while deleting product offer:',error.message); 
       return res.status(400).json({error:'error in deleting product offer.'})
    }
}

// page rendering for edit product offer 
const editProductOfferPage = async(req, res) => {
    try {
        const productOfferId = req.params.id;
        const productOffer  = await productOfferModel.findById(productOfferId).populate('products');
        const products = await productModel.find();
        if (!productOffer) {
            return res.status(404).send('product offer not found');
        }
        res.render('admin/editProductOffer', {  productOffer, products});
    } catch (error) {
        console.log('error in product editpage rendering:',error.message);
    }
}

// editing product offer
const editProductOffer = async(req, res) => {
    try {
        const productOfferId = req.params.id;
        const { offerName, discountPercentage, startDate, endDate,productId} = req.body;
        
        if (isNaN(discountPercentage) || discountPercentage < 1 || discountPercentage > 90) {
            req.flash('error', 'Discount percentage must be a number between 1 and 90.');
            return res.redirect(`/admin/product/editOffer/${productOfferId}`); 
        }
        const updateOffer = await productOfferModel.findByIdAndUpdate(productOfferId,{
            products:productId,
            offerName,
            discountPercentage,
            startDate,
            endDate
        },{ new: true })
        req.flash('success',"offer edited successfully.");
        res.redirect('/admin/product/offerList')
    } catch (error) {
        console.log('error in editing product offer:',error.message);
        req.flash('error',"error in offer editing.");
        res.redirect('/admin/product/offerList')
    }
}


module.exports ={
    productOfferList,
    addProductOfferPage,
    addProductOffer,
    deleteProductOffer,
    editProductOfferPage,
    editProductOffer
    
}