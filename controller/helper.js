const { ObjectId } = require('mongodb');
const cartModel = require('../models/cart');

// Check if a product already exists in the cart
const cartProductExists = async (userId, productId) => {
    const cartData = await cartModel.aggregate([
        { $match: { userId: new ObjectId(userId) } },
        { $unwind: '$products' },
        { $match: { 'products.productId': new ObjectId(productId) } },
        { $project: { _id: 1 } }
    ]);
    return cartData.length > 0;
};

// Add a product to the cart
const addProductToCart = async (userId, productId, quantity = 1) => {
    const exists = await cartProductExists(userId, productId);

    if (exists) {
        return updateProductQuantity(userId, productId, quantity);
    }

    const update = await cartModel.updateOne(
        { userId: new ObjectId(userId) },
        {
            $push: {
                products: {
                    productId: new ObjectId(productId),
                    quantity
                }
            }
        },
        { upsert: true }
    );

    return update.modifiedCount > 0 || update.upsertedCount > 0;
};

// Update the quantity of a product in the cart
const updateProductQuantity = async (userId, productId, quantity) => {
    const update = await cartModel.updateOne(
        { userId: new ObjectId(userId), 'products.productId': new ObjectId(productId) },
        { $inc: { 'products.$.quantity': quantity } }
    );
    return update.modifiedCount > 0;
};

// Remove a product from the cart
const removeProductFromCart = async (userId, productId) => {
    const update = await cartModel.updateOne(
        { userId: new ObjectId(userId) },
        { $pull: { products: { productId: new ObjectId(productId) } } }
    );
    return update.modifiedCount > 0;
};

// Clear the entire cart for a user
const clearCart = async (userId) => {
    const update = await cartModel.updateOne(
        { userId: new ObjectId(userId) },
        { $set: { products: [] } }
    );
    return update.modifiedCount > 0;
};

// Fetch the user's cart
const getUserCart = async (userId) => {
    return await cartModel.findOne({ userId: new ObjectId(userId) });
};

module.exports = {
    cartProductExists,
    addProductToCart,
    updateProductQuantity,
    removeProductFromCart,
    clearCart,
    getUserCart
};
