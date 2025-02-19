const brandModel = require('../models/brand');

//adding new brand of products
const brandAdd = async(req,res) => {
    try {
        const {name} = req.body;
        const lowerCaseName = name.toLowerCase(); 
        const brandDetails = await brandModel.findOne({name:lowerCaseName})
        if(brandDetails){
        req.flash('error',"Brand name already exist.")
        return res.redirect('/admin/category')
        }
        const newBrand = new brandModel({
            name :lowerCaseName
        })
        await newBrand.save()

        req.flash('success',"new brand added successfully.")
        res.redirect('/admin/category')
    } catch (error) {
        console.error("category error",error.message)
        req.flash('error',"some error occured while adding the brand.")
        res.redirect('/admin/category')
    }
}

//brand editing page rendering
const editBrand = async(req,res)=>{
    try {
        let id = req.params.id
        let brand = await brandModel.findById(id)
        res.render('admin/editBrand',{brands:brand})
    } catch (error) {
        console.log("brand edit error:",error.message)
    }
}

//brand editing page rendering
const getBrand = async(req,res)=>{
  try {
      let id = req.params.id
      let brands = await brandModel.find()
    res.render('admin/admin-category', { brand: brands });
  } catch (error) {
      console.log("brand edit error:",error.message)
  }
}



//updating the already existing brand
const editBrandAction = async(req,res) =>{
    try {
        const id=req.params.id;
        const {brandName} =req.body;
        const lowerCaseName = brandName.toLowerCase(); 
        const brandDetails = await brandModel.findOne({name:lowerCaseName})
        if(brandDetails){
        req.flash('error',"Brand name already exist.")
        return res.redirect('/admin/category')
        }
        let brand = await brandModel.findById(id)

        brand.name = lowerCaseName;
        await brand.save();

        req.flash('success','successfully edited the brand.')
        res.redirect('/admin/category')
    } catch (error) {
        console.log('editing brand',error.message);
    }
 
}


//deleting already existing brand
const deleteBrand = async(req,res) =>{
    try {
        
        const brand = await brandModel.findByIdAndDelete(req.params.id)
        if(!brand){
            req.flash('error',"Error in finding the brand.");
            res.redirect('/admin/category')
        }
        req.flash('success','The brand is deleted successfully');
        res.redirect('/admin/category')
    } catch (error) {
        console.log("delete brand error:",error.message);
        req.flash('error',"Error in deleting brands.");
        res.redirect('/admin/category')
    }
}




module.exports = {
  getBrand,
    brandAdd,
    editBrand,
    editBrandAction,
    deleteBrand
}