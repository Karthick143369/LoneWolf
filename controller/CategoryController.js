const categoryModel = require('../models/category');
const brandModel = require('../models/brand');
const categoryOfferModel = require('../models/categoryOffer')

//render category and brand management page
const category = async(req,res) =>{
    try {

        const brands = await brandModel.find()
        const categories = await categoryModel.find()
        // console.log('brand ',brands)
        res.render('admin/admin-category',{brand:brands,category:categories})

    } catch (error) {
        console.log("error in category:",error.message)
    }
   
    
}


//adding category filed of products
const categoryAdd = async(req,res) => {
    try {
        const { name } = req.body;
        const lowerCaseName = name.toLowerCase(); 
        const categoryDetails = await categoryModel.findOne({name:lowerCaseName})
        if (categoryDetails) {
            // req.flash('error', "")
            return res.status(400).json({ message: "Category name already exist." });

        } else {
        
            const category = new categoryModel({
                name: lowerCaseName
            })
            await category.save()

            req.flash('success', "new category added successfully.");
            res.redirect('/admin/category');
        }
    } catch (error) {
        console.error("category error",error.message)
        req.flash('error',"some error occured while adding the category.")
        res.redirect('/admin/category')
    }
}

//category editing page rendering
const editCategory = async(req,res)=>{
    try {
        let id = req.params.id
        let category = await categoryModel.findById(id)
        res.render('admin/edit-category',{categories:category})
    } catch (error) {
        console.log("editcategory error:",error.message)
    }

}

//edited category updation
const editCategoryAction =async(req,res) =>{
    try {
        const id=req.params.id;
        const {categoryName} =req.body;
        const lowerCaseName = categoryName.toLowerCase(); 
        const categoryDetails = await categoryModel.findOne({name:lowerCaseName})
        if(categoryDetails){
        req.flash('error',"Category name already exist.")
        return res.redirect('/admin/category')
        }
        let category = await categoryModel.findById(id)
        category.name = lowerCaseName;
        await category.save();

        req.flash('success','successfully edited the category.')
        res.redirect('/admin/category')
    } catch (error) {
        console.log('editing category',error.message);
    }
}


//deleting one category
const deleteCategory = async(req,res) =>{
    try {
        
    const brand = await categoryModel.findByIdAndDelete(req.params.id)
    if(!brand){
        req.flash('error',"Error in finding the category.");
        res.redirect('/admin/category');
    }
        
        
        
        req.flash('success','The category is deleted successfully');
        res.redirect('/admin/category')
    } catch (error) {
        console.log("delete brand error:",error.message);
        req.flash('error',"Error in deleting category.");
        res.redirect('/admin/category')
    }
}


const blockCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await categoryModel.findById(categoryId);
        console.log(categoryId);

        if (!category) {
            req.flash('error', 'category not found');
            const fullproducts = await productModel.find().exec();
            return res.render('admin/category', )
        }

        category.isActive = false;
        await category.save();
        req.flash('success', "product blocked successfully.")

        res.redirect('/admin/category')
    } catch (error) {
        req.flash('error', "Error in blocking product.")
        const fullcategory = await categoryModel.find().exec();
        res.render('admin/productList', { category: fullproducts })
    }
}


const unblockCategory = async (req, res) => {
    try {

        const categoryId = req.params.id;
        const category = await categoryModel.findById(categoryId);
        if (!category) {
            return res.status(404).send({ error: 'category not found' });
        }

        category.isActive = true;
        await category.save();

        req.flash('success', "category unblocked successfully.")
        res.redirect('/admin/category')

    } catch (error) {
        console.log("block category error:", error.message);
    }
}


// category offer lists
const categoryOfferList = async(req, res)=> {
    try {
        const categoryOffer = await categoryOfferModel.find().populate('categories');
        console.log('cat off is:',categoryOffer)
        res.render('admin/categoryOffer',{categoryOffer})
    } catch (error) {
        console.log('error in category offer listing:',error.message);
    }
}

// category offer updating page
const categoryOfferUpdatePage = async(req, res) => {
    try {
        const categories = await categoryModel.find()
        const usedCategoryOffers = await categoryOfferModel.distinct('categories');
        
        const usedCategoryIds = usedCategoryOffers.map(id => id.toString());
        const filteredCategories = categories.filter(category => 
            !usedCategoryIds.includes(category._id.toString())
        );
        res.render('admin/addCategoryOffer',{categories:filteredCategories})
    } catch (error) {
        console.log('error in rendering category offer page:',error.message);
    }
}

const addCategoryOffer = async (req, res) => {
    try {
        const {categoryId, offerName, discountPercentage, startDate, endDate} = req.body;
        
        if (isNaN(discountPercentage) || discountPercentage < 1 || discountPercentage > 90) {
            return res.status(400).json({error:'Discount percentage must be a number between 1 and 90.'});
        }
        const expiryDateObj = new Date(endDate);
        console.log('expriry date:',expiryDateObj)
        if(expiryDateObj<Date.now()){
            return res.status(400).json({error:'Expiry date must be after todays date.'});
        }
        const categoryOffer = new categoryOfferModel({
            categories:categoryId,
            offerName,
            discountPercentage,
            startDate,
            endDate
        })
        const savedOffer = await categoryOffer.save();
        res.status(200).json({success: 'category offer updated successfully'});
    } catch (error) {
        console.log('error in adding category offer:',error.message);
    }
}

const deleteCategoryOffer = async(req, res) => {
    try {
        const categoryId = req.params.id;
        const catOffer = await categoryOfferModel.findByIdAndDelete(categoryId);
        if(!catOffer){
            return res.status(400).json({error:'No category offer found'});
        }
        res.status(200).json({success:'Your category is offer deleted.'});
    } catch (error) {
       console.log('error while deleting category offer:',error.message); 
       return res.status(400).json({error:'error in deleting category offer.'})
    }
}

const editCategoryOfferPage = async(req, res) => {
    try {
        const categoryId = req.params.id;
        const categoryOffer  = await categoryOfferModel.findById(categoryId);
        const categories = await categoryModel.find();
        if (!categories) {
            return res.status(404).send('Category offer not found');
        }
        res.render('admin/editCategoryOffer', { categories, categoryOffer });
    } catch (error) {
        console.log('error in editpage rendering:',error.message);
    }
}

const editCategoryOffer = async(req, res) => {
    try {
        const category = req.params.id;
        const {categoryId, offerName, discountPercentage, startDate, endDate} = req.body;
        if (isNaN(discountPercentage) || discountPercentage < 1 || discountPercentage > 90) {
            req.flash('error', 'Discount percentage must be a number between 1 and 90.');
            return res.redirect(`/admin/categoryOffer/edit/${category}`); 
        }
        const expiryDateObj = new Date(endDate);
        console.log('expriry date:',expiryDateObj)
        if(expiryDateObj<Date.now()){
            req.flash('error', 'expiry date should be more than today.');
            return res.redirect(`/admin/categoryOffer/edit/${category}`); 
        }
        const updateOffer = await categoryOfferModel.findByIdAndUpdate(category,{
            categories:categoryId,
            offerName,
            discountPercentage,
            startDate,
            endDate
        },{ new: true })

        req.flash('success',"offer edited successfully.");
        res.redirect('/admin/categoryOffer')
    } catch (error) {
        console.log('error in editing category offer:',error.message);
        req.flash('error',"error in offer editing.");
        res.redirect('/admin/categoryOffer')
    }
}


module.exports = {
    category,
    categoryAdd,
    editCategory,
    editCategoryAction,
    deleteCategory,
    blockCategory,
    unblockCategory,
    categoryOfferList,
    categoryOfferUpdatePage,
    addCategoryOffer,
    deleteCategoryOffer,
    editCategoryOfferPage,
    editCategoryOffer
}