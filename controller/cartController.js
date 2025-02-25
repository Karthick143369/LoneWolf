require('express');
const productModel = require('../models/product');
const cartModel = require('../models/cart');
const helpers = require('../controller/helper');
const categoryOfferModel = require('../models/categoryOffer');
const productOfferModel = require('../models/productOffer');
const wishList = require('../models/wishList');

// showing cart page for perticular users
const cartPage = async (req, res) => {
    try {
        if (req.session.isUser) {
            let userId = req.session.userId;
            if (userId) {
                let cartItems = await cartModel.findOne({ userId }).populate('products.productId');
                
                if (cartItems) {
                    let grandTotalAmount = 0;

                    // Recalculate prices based on the latest offers
                    for (let item of cartItems.products) {
                        const { adjustedPrice, appliedOffer } = await getAdjustedPrice(item.productId);
                        item.total = adjustedPrice * item.quantity;
                        item.offerPrice = adjustedPrice;
                        grandTotalAmount += item.total;
                    }

                    cartItems.grandTotal = grandTotalAmount;
                    await cartItems.save();
                    ///asdfghj

                    res.render('user/cart', { cartItems, grandTotalAmount });
                } else {
                    res.render('user/cart', { cartItems: [], grandTotalAmount: 0 });
                }
            } else {
                res.redirect('/', { message: "Please login first to view the cart page." });
            }
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.log('Cart Page error:', error.message);
        res.redirect('back');
    }
};

const getAdjustedPrice = async (productId) => {
    let adjustedPrice;
    let appliedOffer = null;

    const productItem = await productModel.findById(productId);
    if (productItem) {
        const productPrice = productItem.price;

        const productOffer = await productOfferModel.findOne({ products: productId });
        if (productOffer) {
            adjustedPrice = productPrice * ((100 - productOffer.discountPercentage) / 100);
            appliedOffer = 'product';
        } else {
            const categoryOffer = await categoryOfferModel.findOne({ categories: productItem.category });
            if (categoryOffer) {
                adjustedPrice = productPrice * ((100 - categoryOffer.discountPercentage) / 100);
                appliedOffer = 'category';
            } else {
                adjustedPrice = productPrice;
            }
        }
    }

    return { adjustedPrice, appliedOffer };
};
// const addToCart = async (req, res) => {
//   console.log(`hit addToCart`);

//     try {
//         const { productId } = req.body;
//         const userId = req.session.userId;

//         const productItem = await productModel.findById(productId);
//         //is Activetrue
//         if (!productItem) {
//             res.status(500).render('404error');
//         } else {
//             const { adjustedPrice } = 10;

//             // Check if the product exists in the cart already
//           const productExists = await helpers.cartProductData(userId, productId);
//           console.log(`productExists:${productExists}`);
//             if (productExists) {
//                 res.redirect('/cart');
//             } else {
//                 let cart = await cartModel.findOne({ userId });
//                 if (cart) {
//                     cart.products.push({ productId, quantity: adjustedPrice, total: adjustedPrice, offerPrice: adjustedPrice });
//                     cart.grandTotal += 1;
//                     await cart.save();
//                 } else {
//                     cart = new cartModel({
//                         userId: userId,
//                         products: [{ productId, quantity: adjustedPrice, total: adjustedPrice, offerPrice: adjustedPrice }],
//                         grandTotal: 1
//                     });
//                     await cart.save();
//                 }
//                 res.redirect('/cart');
//             }
//         }
//     } catch (error) {
//         console.log('addtocart error:', error.message);
//         res.status(500).render('404error', { message: 'Error in adding product to cart' });
//     }
// };



//update the quantity of the products

const addToCart = async (req, res) => {    
      try {
          const { productId } = req.body;
          const userId = req.session.userId;
  
          const productItem = await productModel.findById(productId);
          console.log(`issue 1`);

          
          //is Activetrue
          if (!productItem) {
            return  res.status(500).render('404error');
          } else {
              
              
  
              // Check if the product exists in the cart already
            const productExists = await helpers.cartProductExists(userId, productId);
              let cart = await cartModel.findOne({ userId });
              console.log(`issue 2`);
              console.log(productExists);

              if (productExists) {
                console.log(productExists);
                const productIndex = cart.products.findIndex((product) => product.productId==productId)
                console.log(productIndex,cart.products);
                  cart.products[productIndex].quantity += 1;
                  console.log(`issue 3`);
                await cart.save()
                 
                // await cart.save();
                  res.redirect('/cart');

              } else {
                  console.log('log arrived');
                 
                  if (cart) {
                    const productIndex = cart.products.findIndex((product) => product.productId==productId)
                    console.log(productIndex,cart.products);
                      if (productIndex !=-1) {
                          cart.products[productIndex].quantity = 1;
                          console.log(`issue 4`);

                          await cart.save()
                                              
                          
                      } else {
                          cart.products.push({ productId, quantity: 1, total: productExists.total, offerPrice: productExists.offerPrice  });
                          cart.grandTotal += 1;
                          console.log(`issue 5`);
                          await cart.save();
                          
                      }
                      
                  } else {
                      cart = new cartModel({
                          userId: userId,
                          products: [{ productId, quantity: 1, total:productItem?.price , offerPrice: 1 }],
                          grandTotal: productItem?.price,
                          maxStock :productItem?.stock
                      });
                      console.log(`issue 6`);

                      await cart.save();
                  }
                  res.redirect('/cart');
              }
          }
      } catch (error) {
          console.log('addtocart error:', error.message);
          res.status(500).render('404error', { message: 'Error in adding product to cart' });
      }
  };

  const updateQuantity = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.userId;
        const cart = await cartModel.findOne({ userId }).populate('products.productId');
        if (cart) {
            const product = cart.products.find(p => p.productId._id.toString() === productId);
            if (product) {
                let productTotal = product.offerPrice * quantity
                product.quantity = quantity;
                product.total = productTotal;

                //finding the grand total of all the products
                let grandT = cart.products.reduce((acc, curr) => {
                    acc = acc + (curr.offerPrice * curr.quantity)
                    return acc
                }, 0)
                cart.grandTotal = grandT
                await cart.save();

                res.status(200).json({ message: 'Quantity updated successfully.', grandT, productTotal });

            } else {
                res.status(404).json({ error: 'product is not found in cart' });
            }
        } else {
            res.status(404).json({ error: 'Cart not found.' });
        }
    } catch (error) {
        console.log('Update quantity error:', error.message);
        res.status(500).json({ error: 'Error in updating quantity.' })
    }
}





// Deleting a product from the cart
const deleteCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.userId;

        // Find and update the cart, pulling out the specified product
        const updatedCart = await cartModel.findOneAndUpdate(
            { userId: userId },
            { $pull: { products: { productId: productId } } },
            { new: true }
        ).populate('products.productId');

        if (!updatedCart) {
            await cartModel.deleteOne({ userId: userId });
            return res.status(200).json({ success: 'Cart is empty after deleting the product.' });
        }

        let grandTotal = 0;
        for (const item of updatedCart.products) {
            grandTotal += item.quantity * item.offerPrice;
        }

        updatedCart.grandTotal = grandTotal;
        await updatedCart.save();

        res.status(200).json({ success: 'Successfully deleted the product from the cart.', grandTotal });
    } catch (error) {
        console.log('Error deleting product from cart:', error.message);
        req.flash('error', 'Error in deleting the product from the cart.');
        res.redirect('/user/cart');
    }
};


const getCartCount = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        if (!userId) {
            return res.json({ count: 0 });
        }

        const cart = await cartModel.findOne({ userId: userId });
        
        if (!cart || !cart.products) {
            return res.json({ count: 0 });
        }
        // Count only active products with stock
        const activeProductCount = cart.products.filter(item => item
            // item.productId && 
            // item.productId.isActive == true && 
            // item.productId.stock > 0
        ).length;
   


        res.json({ count: activeProductCount });
    } catch (error) {
        console.error('Error fetching cart count:', error);
        res.status(500).json({ error: 'Failed to fetch cart count' });
    }
};


module.exports = {
  addToCart,
  cartPage,
  updateQuantity,
  deleteCart,
  getCartCount
}