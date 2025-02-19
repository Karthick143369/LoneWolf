const productModel = require('../models/product');
const wishlistModel = require('../models/wishList');
// const productOfferModel = require('../models/productOffer');
// const categoryOfferModel = require('../models/categoryOffer');


// // product added to wishlist
const wishProduct = async (req, res) => {
    try {

        const { productId } = req.body;
        const userId = req.session.userId;

        //find if the user already have wishlist
        let wishList = await wishlistModel.findOne({ userId })
        if (wishList) {

            if (wishList.products.includes(productId)) {

                // if product already exist in the wishlist just remove it 
                const remove = await wishlistModel.updateOne({ userId }, { $pull: { products: productId } });


                //    check if any products in the wishlist
                const wishListNew = await wishlistModel.findOne({ userId });
                if (!wishListNew || wishListNew.products.length === 0) {
                    // if no products in wishlist just remove it
                    await wishlistModel.deleteOne({ userId });
                }
                res.json({ message: 'product removed from the wishlist' });
            } else {
                wishList.products.push(productId);
                await wishList.save();


                console.log('product added to wishlist');
                res.json({ message: 'product added to wishlist successfully' });
            }
        } else {
            const newWishlist = new wishlistModel({
                userId,
                products: [productId]
            })
            await newWishlist.save();

            res.json({ message: ' product added to the wishlist successfully' });
        }

    } catch (error) {
        console.log('error in add to wish list: ', error.message);
        res.status(500).json({ message: 'Error adding product to wishlist' });
    }
}

// //wishlist page showing
const wishList = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect('/', { message: "Please log in to view your wishlist." });
        }
        const wishlist = await wishlistModel.findOne({ userId }).populate('products');

        if (!wishlist || wishlist.products.length === 0) {
            return res.render('user/wishList', { wishlists: [] });
        }

        // Recalculate prices based on the latest offers
        for (let item of wishlist.products) {
            const { adjustedPrice, appliedOffer } = await getAdjustedPrice(item._id);
            item.adjustedPrice = adjustedPrice; // Adding the adjusted price to the product
        }

        res.render('user/wishList', { wishlists: [wishlist] });
    } catch (error) {
        console.log('error in wishlist page:', error.message);
        res.status(500).render('500error', { message: 'Error displaying wishlist' });
    }
};

const getAdjustedPrice = async (productId) => {
    let adjustedPrice;
    let appliedOffer = null;

    const productItem = await productModel.findById(productId);
    if (productItem) {
        const productPrice = productItem.price;

        // const productOffer = await productOfferModel.findOne({ products: productId });
        // if (productOffer) {
        //     adjustedPrice = productPrice * ((100 - productOffer.discountPercentage) / 100);
        //     appliedOffer = 'product';
        // } else {
        //     const categoryOffer = await categoryOfferModel.findOne({ categories: productItem.category });
        //     if (categoryOffer) {
        //         adjustedPrice = productPrice * ((100 - categoryOffer.discountPercentage) / 100);
        //         appliedOffer = 'category';
        //     } else {
        //         adjustedPrice = productPrice;
        //     }
        // }
    }

    return { adjustedPrice };
};


// delete item in wishlist
const deleteWish = async (req, res) => {
    try {
        console.log('entered to delete wishlist api')
        const productId = req.params.id;
        const userId = req.session.userId;

        console.log('productid is getting:', productId);

        const remove = await wishlistModel.updateOne({ userId }, { $pull: { products: productId } });

        //   product model making wishlist into false
        await productModel.findByIdAndUpdate(productId,
            { isWishlist: false },
            { new: true }
        )

        const wishListNew = await wishlistModel.findOne({ userId });
        if (!wishListNew || wishListNew.products.length === 0) {

            // if no products in wishlist just remove it
            await wishlistModel.deleteOne({ userId });
        }
        res.json({ success: 'product deleted from wishlist' });
    } catch (error) {
        console.log('error while deleting products from wishlist:', error.message);
    }
}

module.exports = {
    wishList,
    wishProduct,
    deleteWish
}