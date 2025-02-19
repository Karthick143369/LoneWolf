const express = require('express');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');
const productModel = require('../models/product');
const categoryModel = require('../models/category');
const brandModel = require('../models/brand')
const upload = require('../helpers/productMulter');
const { check, validationResult } = require('express-validator');
const { Mongoose, default: mongoose } = require('mongoose');
const { Buffer } = require('buffer');




const productList = async (req, res) => {
    try {
        const products = await productModel.find().exec();
        res.render('admin/admin-product', { products: products });
    } catch (error) {
        console.error("Error in getting product list:", error);
        res.render("admin/productList", { error: "something went wrong in product list " });
    }
};


// for getting product adding page
const addProduct = async (req, res) => {
    try {
        const categories = await categoryModel.find();
        const brands = await brandModel.find();

        res.render('admin/addingProduct', {
            categories,
            brands, editMode: false
        });
    } catch (error) {
        console.log('Error fetching categories and brands:', error.message);
    }
}



// For posting product details
const addProductAction = async (req, res) => {
  console.log(`${'start'}`);
  console.log(req.files.length);
  try {
        if (!req.files || req.files.length !== 3) {
            console.log('req.files1:', req.files)
            // res.status(400).json({ message: 'Please upload exactly 3 images.' });
            req.flash('error','Please upload exactly 3 images.')
           return res.redirect('/admin/product/addProduct')
        }
      
     
        // Handle new images
      let newImages = [];
      
        if (req.files && req.files.length) {
            newImages = req.files.map(file => `/images/product/${file.filename}`); 
        }
      
      const productExists = await productModel.findOne({ productName: req.body.productName });
      
        if (productExists) {
            return res.status(404).json({ success: false, errors: ['Product name is already in use'] });
        }

     
        // if (product.images.length + newImages.length > 3) {
        //     return res.status(400).json({ success: false, errors: ['Cannot have more than 3 images'] });
        // }

        // if (product.images.length + newImages.length < 3) {
        //     return res.status(400).json({ success: false, errors: ['At least 3 images are required'] });
        // }
        
        if(req.body.price<=0){
            return res.status(400).json({ success: false, errors: ['price must be greater than zero'] });
        }
        if(req.body.stock<=-1){
            return res.status(400).json({ success: false, errors: ['Stock must be greater than zero'] });
        }

        const newProduct = new productModel({
            productName: req.body.productName,
            price: req.body.price,
            stock: req.body.stock,
            rating: req.body.rating,
            FitType: req.body.FitType,
            colour: req.body.colour,
            size: req.body.size,
            Description: req.body.Description,
            brand: req.body.brand,
            category: req.body.category
        });


        const images = req.files;
        const imagePaths = [];
      console.log(`${'beforeimagepush'}`);

        for (const image of images) {
            const imagePath = `/images/product/${image.filename}`;
            imagePaths.push(imagePath);
        }

      newProduct.images = imagePaths;

      
      await newProduct.save();
      res.json({ success: true }); 
      console.log(`${'Saved'}`);
    //   res.redirect('/admin/product/productList');
    } catch (error) {
        console.error("Error saving product:", error.message);
        res.status(500).json({ message: 'An error occurred while adding the product.' });
    }
};



const blockProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await productModel.findById(productId);

        if (!product) {
            req.flash('error', 'Product not found');
            const fullproducts = await productModel.find().exec();
            return res.render('admin/productList', { products: fullproducts })
        }

        product.isActive = false;
        await product.save();
        req.flash('success', "product blocked successfully.")

        res.redirect('/admin/product/productList')
    } catch (error) {
        req.flash('error', "Error in blocking product.")
        const fullproducts = await productModel.find().exec();
        res.render('admin/productList', { products: fullproducts })
    }
}


const unblockProduct = async (req, res) => {
    try {

        const productId = req.params.id;
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).send({ error: 'Product not found' });
        }

        product.isActive = true;
        await product.save();

        req.flash('success', "product unblocked successfully.")
        res.redirect('/admin/product/productList')

    } catch (error) {
        console.log("block product error:", error.message);
    }
}


// render product editing page
const editPage = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await productModel.findById(id);
        const categories = await categoryModel.find();
        const brands = await brandModel.find();
        if (!product) {
            req.flash('error', 'product is not found.');
            res.redirect('/admin/product/productList');
        } else {
            res.render('admin/editingProduct', { product, editMode: true, categories, brands })
        }
    } catch (error) {
        console.log('editpage:', error.message)
    }

}

// updating the already existing image
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { productName, price, stock, FitType, colour, size, Description, brand, category } = req.body;
        console.log(req.body);
        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, errors: ['Product not found'] });
        }

        // Handle new images
        let newImages = [];
        if (req.files && req.files.length) {
            newImages = req.files.map(file => `/images/product/${file.filename}`); 
        }

     
        if (product.images.length + newImages.length > 3) {
            return res.status(400).json({ success: false, errors: ['Cannot have more than 3 images'] });
        }

        if (product.images.length + newImages.length < 3) {
            return res.status(400).json({ success: false, errors: ['At least 3 images are required'] });
        }
        
        if(price<=0){
            return res.status(400).json({ success: false, errors: ['Stock price must be greater than zero'] });
        }
        if(stock<=-1){
            return res.status(400).json({ success: false, errors: ['Stock must be greater than -1'] });
        }
        product.productName = productName;
        product.price = price;
        product.stock = stock;
        product.FitType = FitType;
        product.colour = colour;
        product.size = size;
        product.Description = Description;
        product.brand = brand;
        product.category = category;

        // Append new images to existing ones
        product.images = [...product.images, ...newImages];

      
        await product.save();
        res.json({ success: true }); 
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, errors: ['Server error'] }); 
    }
};


// deleting the images in product editing
const deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { image } = req.body;

        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        const imageIndex = product.images.indexOf(image);
        if (imageIndex === -1) {
            return res.status(400).send('Image not found');
        }
       
        product.images.splice(imageIndex, 1);
        await product.save();

        res.status(200).send('Image deleted successfully');
    } catch (error) {
        console.log('error occured in deleting image:', error)
        res.status(500).send('Server error');
    }
}



module.exports = {
    addProduct,
    addProductAction,
    productList,
    blockProduct,
    unblockProduct,
    editPage,
    updateProduct,
    deleteImage
}