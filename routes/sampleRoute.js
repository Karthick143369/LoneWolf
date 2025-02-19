const express = require('express');
const sampleRouter = express.Router();
const Product = require('../models/product'); // Replace with your Product model

// Product detail route
sampleRouter.get('/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        // Fetch the product by ID
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.render('user/productDetail', { product });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Add to Cart route (POST request)
sampleRouter.post('/cart', (req, res) => {
    const { productId, quantity } = req.body;

    // Example: Handle the cart logic
    // Here you can add the product to the cart database/session
    console.log(`Product ID: ${productId}, Quantity: ${quantity}`);

    res.redirect(`/product/${productId}`); // Redirect back to product detail page
});

module.exports = sampleRouter;
