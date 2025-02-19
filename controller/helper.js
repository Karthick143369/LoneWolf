const { ObjectId } = require('mongodb')
const cartModel = require('../models/cart')

//checking cart product already existing or not
const cartProductData = async (userId, productId) => {
    const cartData = await cartModel.aggregate([
        {
            $match: {
                userId: new ObjectId(userId)
            }
        },
        {
            $unwind: '$products'
        },
        {
            $match: {
                'products.productId': new ObjectId(productId)
            }
        },
        {
            $project: {
                _id: 1
            }
        }
    ])
    return cartData.length > 0
}


module.exports = {
    cartProductData,
    
}