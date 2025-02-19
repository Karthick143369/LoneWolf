const userModel = require('../models/User');
const cartModel = require('../models/cart')
const orderModel = require('../models/order');
const productModel = require('../models/product');
const productReturn = require('../models/returnProduct')
const walletModel = require('../models/wallet');
const failedOrderModel = require('../models/failedOrder');
const easyinvoice = require('easyinvoice');
const mongoose = require('mongoose')
const Razorpay = require('razorpay');

// create a instance for razopay
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});


//placing product order
const placeOrder = async (req, res) => {

    try {
        const userId = req.session.userId;
        const { mobileNumber, addressId, paymentMethod, totalAmount, cartItemID, userName, grandTotal, couponAmount } = req.body;
        console.log(req.body);
        console.log(paymentMethod);
        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.status(400).json({ error: 'User not found' });
        }

        const selectedAddress = userData.address.find(addr => addr._id.toString() === addressId);
        if (!selectedAddress) {
            return res.status(400).json({ error: 'Please select one address to continue' });
        }

        if (!mobileNumber) {
            return res.status(400).json({ error: 'Please enter mobile number to continue' });
        }

        if (!cartItemID) {
            return res.status(400).json({ error: 'There are no cart items for ordering' });
        }

        const cart = await cartModel.findById(cartItemID).populate('products.productId');
        if (!cart) {
            return res.status(400).json({ error: 'Cart not found' });
        }

        if (!paymentMethod) {
            return res.status(400).json({ error: 'Please select one payment method to continue' });
        }

        let paymentDetails = {};
        if (paymentMethod === 'Razorpay') {
            const options = {
                amount: totalAmount * 100, 
                currency: 'INR',
                receipt: `order_rcptid_${userId}`,
                payment_capture: 1
            };

            razorpayOrder = await razorpayInstance.orders.create(options);
            return res.status(200).json({ success: ' razorpay payment placed successfully', razorpayOrderId: razorpayOrder.id });


        } else if (paymentMethod === 'COD' || paymentMethod === 'Wallet') {
            if (paymentMethod === 'Wallet') {
                const walletBalance = userData.wallet || 0;
                if (walletBalance >= totalAmount) {
                    userData.wallet -= totalAmount;
                    await userData.save();

                     // Save wallet transaction
                     const wallet = new walletModel({
                        userId: userId,
                        amount: totalAmount,
                        type: 'debit',
                        description: 'Order Payment'
                    });
                    await wallet.save();

                    paymentDetails = {
                        paymentMethod: 'Wallet',
                        paymentStatus: 'success',

                    };

                } else {
                    console.log('wallet amount is not enough')
                    return res.status(400).json({ error: 'Insufficient wallet balance.' });
                }
            } else {
                console.log('enter in to cod')
                paymentDetails = {
                    paymentMethod: 'COD',
                    paymentStatus: 'pending',
                };
            }
            // Map cart items to order items
            const productItems = cart.products.map(product => ({
                productId: product.productId._id,
                productName: product.productId.productName,
                quantity: product.quantity,
                total: product.total
            }));

            console.log(paymentDetails?.paymentMethod);

            // if cod save the data
            const newOrder = new orderModel({
                userId: userId,
                productItems: productItems,
                billingAddress: selectedAddress,
                phone: mobileNumber,
                paymentMethod: paymentDetails?.paymentMethod,
                totalPrice: totalAmount,
                userName: userName,
                originalPrice: grandTotal,
                couponDiscount: couponAmount,
            });

            await newOrder.save();
            console.log(`saved`);
            for (const item of productItems) {
                await productModel.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );
            }
            req.session.newOrder = newOrder._id.toString();

            //  to clear the cart
            await cartModel.deleteOne({ _id: cartItemID });
            res.status(200).json({ success: 'Order placed successfully', walletPaymentStatus: paymentDetails.paymentStatus });
        }

    } catch (error) {
        console.log('Error in placing order:', error.message);
        res.status(400).json({ error: 'Some errors occurred while placing the order, try again' });
    }
};

// place order using razorpay
const paymentOrder = async (req, res) => {
    try {
        const userId = req.session.userId;

        const paymentData = req.body;
        const orderData = paymentData.orderData;
        const { mobileNumber, addressId, paymentMethod, cartItemID, totalAmount, userName, grandTotal, couponAmount } = orderData;
        console.log(paymentMethod);
        const { orderId, paymentId, razorpayOrderId, amount } = paymentData;
        console.log(`point1`);

        const userData = await userModel.findById(userId);
        const selectedAddress = userData.address.find(addr => addr._id.toString() === addressId);
        const cart = await cartModel.findById(cartItemID).populate('products.productId');

        const productItems = cart.products.map(product => ({
            productId: product.productId._id,
            productName: product.productId.productName,
            quantity: product.quantity,
            total: product.total
        }));
        console.log(`point2`);

        const newOrder = new orderModel({
            userId: userId,
            productItems: productItems,
            billingAddress: selectedAddress,
            phone: mobileNumber,
            paymentMethod: paymentMethod,
            totalPrice: totalAmount,
            userName: userName,
            originalPrice: grandTotal,
            couponDiscount: couponAmount

        });
        console.log(`point3`);

        const orderIs = await newOrder.save();
        console.log(`point4`);

        // Decrease the quantity of each product in the order
        for (const item of productItems) {
            await productModel.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
        }
        req.session.newOrder = newOrder._id.toString();
        console.log(`point4`);

        
        await cartModel.deleteOne({ _id: cartItemID });
        res.status(200).json({ success: 'Order placed successfully with razorpay' });


    } catch (error) {
        console.log('some error while updating the payment:', error.message);
        res.status(400).json({ error: 'Error in placing razorpay.' })
    }
}

// for failed payment through razorpay
const failedPayment = async(req, res) => {
    try {
        const userId = req.session.userId;

        const paymentData = req.body;
        const orderData = paymentData.orderData;
        const { mobileNumber, addressId, paymentMethod, cartItemID, totalAmount, userName, grandTotal, couponAmount } = orderData;
        const { orderId, paymentId, razorpayOrderId, amount } = paymentData;

        const userData = await userModel.findById(userId);
        const selectedAddress = userData.address.find(addr => addr._id.toString() === addressId);
        const cart = await cartModel.findById(cartItemID).populate('products.productId');

        const productItems = cart.products.map(product => ({
            productId: product.productId._id,
            productName: product.productId.productName,
            quantity: product.quantity,
            total: product.total
        }));

        const newOrder = new failedOrderModel({
            userId: userId,
            productItems: productItems,
            billingAddress: selectedAddress,
            phone: mobileNumber,
            paymentMethod: paymentMethod,
            totalPrice: totalAmount,
            userName: userName,
            originalPrice: grandTotal,
            couponDiscount: couponAmount

        });

        const orderIs = await newOrder.save();
        req.session.newOrder = newOrder._id.toString();
        
        //  to clear the cart
        await cartModel.deleteOne({ _id: cartItemID });
        res.status(200).json({ success: ''  });


    } catch (error) {
        console.log('some error while updating the payment:', error.message);
        res.status(400).json({ error: 'Error in placing razorpay.' })
    }
}

//render confirmation page
const confirmation = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orderId = req.session.newOrder
        const order = await orderModel.findById(orderId)

        if (!order) {
            console.log('no order found')
            res.status(404).json('Order not found');

        }
        res.render('user/confirmation', { order });
        req.session.newOrder = null;
    } catch (error) {
        console.log('rendering confirmation page failed:', error.message);

    }

}


//showing all the order of the user
const orderList = async (req, res) => {
    try {
        if (req.session.isUser) {
            const userId = req.session.userId;
            const userData = await userModel.findOne({ name: req.session.isUser });
            const order = await orderModel.find({ userId }).populate('productItems.productId').sort({dateOrdered:-1});
            const failedOrder = await failedOrderModel.find({userId}).populate('productItems.productId');
            res.render('user/orderList', { order, userData ,failedOrder})
        } else {
            res.redirect('/')
        }
    } catch (error) {
        console.log('error in showing order list:', error.message);
    }

}

//api for cancel the products
const orderCancel = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const userId = req.session.userId;
        const order = await orderModel.findById(orderId);

        if (order) {
            const productUpdate = order.productItems.find(item => item.productId.toString() === productId);
            if (productUpdate) {

                const updatedProduct = await productModel.findByIdAndUpdate(
                    productId,
                    { $inc: { stock: productUpdate.quantity } },
                    { new: true }
                )

                // Update the status of the product in productItems array
                productUpdate.status = 'Cancelled';
                await order.save();


                if (order.paymentMethod === 'Razorpay' ||order.paymentMethod === 'Wallet' ) {
                    const total = productUpdate.total;
                    let amount= total
                    if(order.couponDiscount>0 ){
                    const discountPercentage = Math.round((order.couponDiscount *100)/order.originalPrice)
                    amount = Math.round(total *(100-discountPercentage)/100)
                    }

                    const userData = await userModel.findById(userId);
                    userData.wallet += amount;
                    await userData.save();
                    if(order.paymentMethod === 'Razorpay' ){
                        // Save wallet transaction
                     const wallet = new walletModel({
                        userId: userId,
                        amount: amount,
                        type: 'credit',
                        description: 'Order Cancelled through Razorpay'
                    });
                    await wallet.save();
                    }else if(order.paymentMethod === 'Wallet'){
                           // Save wallet transaction
                     const wallet = new walletModel({
                        userId: userId,
                        amount: amount,
                        type: 'credit',
                        description: 'Order cancelled through wallet'
                    });
                    await wallet.save();
                    }
                     
                }

                res.status(200).json({ message: 'Order and product updated successfully', order });
            } else {
                console.log('products not found in order schema:')
                return res.status(404).json({ message: 'product not found in the order.' })
            }
        } else {
            console.log('order is not found')
            return res.status(404).json({ message: 'order not found.' })

        }
    } catch (error) {
        console.log('error in cancel order:', error.message);
        res.status(400).json({ message: 'error occured while cancelling the order' })
    }
}

// product returning request
const returnProduct = async (req, res) => {
    console.log(`hit returnProduct`);
    try {
        const { orderId, productId, returnReason } = req.body;

        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'order not found.' })
        }

        const productUpdate = order.productItems.find(item => item.productId.toString() === productId);
        if (!productUpdate) {
            console.log('products not found in order schema:')
            return res.status(404).json({ message: 'product not found in the order.' })
        }

        productUpdate.status = 'Return Requested';
        productUpdate.returnReason = returnReason;
        await order.save();


        res.json({ success: true });
    } catch (error) {
        console.log('error occured while return a product:', error.message);
        res.status(400).json({ error: 'Failed to submit the return request.' })
    }
}


// downloading order invoice of products
const downloadInvoice = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        console.log('order id:',orderId)
        const order = await orderModel.findById(orderId).populate('productItems.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const product = order.productItems.find(item => item.productId._id.toString() === productId);

        if (!product) {
            console.log('product is not found')
            return res.status(404).send('Product not found in this order');
        }

        // Extracting the address information
        const billingAddress = order.billingAddress[0] || {};

        const invoiceData = {
            "documentTitle": "INVOICE",
            "currency": "USD",
            "taxNotation": "vat",
            "marginTop": 25,
            "marginRight": 25,
            "marginLeft": 25,
            "marginBottom": 25,
            "sender": {
                "company": "LONE WOLF",
                "address": "Kadalundi",
                "zip": "12345",
                "city": "kozhikode",
                "country": "India"
            },
            "client": {
                "company": order.userName,
                "address": billingAddress.street || "Client Address",
                "PinCode": billingAddress.pinCode || "12345",
                "city": billingAddress.city || "City",
                "country": billingAddress.country || "Country"
            },
            "invoiceNumber": order._id.toString(),
            "invoiceDate": order.dateOrdered.toDateString(),
            "products": [
                {
                    "quantity": product.quantity,
                    "description": product.productId.productName,
                    "tax": 0,
                    "price": product.total
                }
            ],
            "bottomNotice": "Thank you for your business."
        };

        const result = await easyinvoice.createInvoice(invoiceData);
        const pdfBuffer = Buffer.from(result.pdf, 'base64');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice_${orderId}.pdf"`);

        res.send(pdfBuffer);
    } catch (error) {
        console.log('download invoice:', error.message);
        res.status(400).json({ error: 'some errors occured while creating invoice' })
    }
}

// order details showing page
const orderDetails = async(req, res) =>{
    try {
        if (req.session.isUser) {
            const userId = req.session.userId;
            const orderId = req.params.orderId;
            const userData = await userModel.findOne({ name: req.session.isUser });
            const order = await orderModel.findOne({ userId ,_id:orderId}).populate('productItems.productId');
            console.log('order is:',order)
            res.render('user/viewOrder', { order, userData})
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.log('error in order details:',error)
        res.status(500).json({error: 'Error in showing order details'})
    }
}

module.exports = {
    placeOrder,
    confirmation,
    orderList,
    orderCancel,
    returnProduct,
    paymentOrder,
    downloadInvoice,
    failedPayment,
    orderDetails
}