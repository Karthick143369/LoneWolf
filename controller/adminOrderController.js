const orderModel = require('../models/order');
const userModel = require('../models/User');


//admin getting all user orders
const orderList = async (req, res) => {
    try {
        const order = await orderModel.find().populate('productItems.productId').sort({dateOrdered:-1});
        console.log('orderlistsare:', order);

        res.render('admin/adminOrderList', { order })
    } catch (error) {
        console.log('order list error:', error.message)
    }
};

//admin changing order status
const orderStatus = async (req, res) => {
    try {
        const { orderId, productId, status } = req.body
        console.log('req.body:', req.body)
        const orderUpdate = await orderModel.updateOne(
            { _id: orderId, 'productItems._id': productId },
            { $set: { 'productItems.$.status': status } }
        )
        const order = await orderModel.findOne({ _id: orderId })
        console.log('update order:', order)
        res.status(200).json({ success: true, message: 'status updated successfully' })
    } catch (error) {
        console.log('order status changing error:', error.message);
        res.status(400).json({ success: false, message: 'error occured while updating status' })
    }
}


//product return management page
const viewOrder = async (req, res) => {
    try {

        const orderId = req.params.orderId;
        const productId = req.params.productId;
        const order = await orderModel.findOne({
            _id: orderId,
            'productItems._id': productId
        }).populate('productItems.productId');


        if (!order) {
            console.log('order not found');
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const product = order.productItems.find(item => item._id.toString() === productId)

        if (!product) {
            console.log('product not found');
            return res.status(404).json({ message: 'Product not found in order' });
        }
        const productDetails = product.productId;
        const allProducts = order.productItems
            .filter(item => item._id.toString() !== productId)
            .map(item => ({
                product: item.productId,
                productName: item.productId.productName,
                quantity: item.quantity,
                price: item.total,
                imageUrl: item.productId.images[0]
            }));
        console.log('all products:',allProducts)
        res.render('admin/orderDetails', {
            order,
            orderId: orderId,
            productId: productId,
            product: product,
            productDetails,
            allProducts,
            imageUrl: productDetails.images[0],
            billingAddress: order.billingAddress[0]
        });
    } catch (error) {
        console.log('error in return management:', error.message);
    }
}

//product return management page
const returnManagement = async (req, res) => {
    try {

        const orderId = req.params.orderId;
        const productId = req.params.productId;
        const order = await orderModel.findOne({
            _id: orderId,
            'productItems._id': productId
        }).populate('productItems.productId');


        if (!order) {
            console.log('order not found');
            return res.status(404).json({ message: 'Order not found' });
        }

        const product = order.productItems.find(item => item._id.toString() === productId)

        if (!product) {
            console.log('product not found');
            return res.status(404).json({ message: 'Product not found in order' });
        }
        const productDetails = product.productId;

        res.render('admin/returnProduct', {
            orderId: orderId,
            productId: productId,
            product: product,
            productDetails,
            imageUrl: productDetails.images[0],
            billingAddress: order.billingAddress[0]
            // Pass other necessary data to render the page
        });
    } catch (error) {
        console.log('error in return management:', error.message);
    }
}


//accepting the return request of the product
const acceptReturn = async (req, res) => {
    try {

        const orderId = req.params.orderId;
        const productId = req.params.productId;

        const order = await orderModel.findOne({
            _id: orderId,
            'productItems._id': productId
        })

        if (!order) {
            console.log('order not found');
            return res.status(404).json({ message: 'Order not found' });
        }

        const product = order.productItems.find(item => item._id.toString() === productId)
        if (!product) {
            console.log('product not found');
            return res.status(404).json({ message: 'Product not found in order' });
        }

        product.status = 'return request accepted'
        await order.save();

        res.json({ success: true })
    } catch (error) {
        console.log('error in accept return :', error.message);
    }
}


//product return request rejected
const rejectReturn = async (req, res) => {
    try {

        const orderId = req.params.orderId;
        const productId = req.params.productId;

        const order = await orderModel.findOne({
            _id: orderId,
            'productItems._id': productId
        })

        if (!order) {
            console.log('order not found');
            return res.status(404).json({ message: 'Order not found' });
        }

        const product = order.productItems.find(item => item._id.toString() === productId)

        if (!product) {
            console.log('product not found');
            return res.status(404).json({ message: 'Product not found in order' });
        }
        product.status = 'return request rejected'
        await order.save();
        res.json({ success: true })

    } catch (error) {
        console.log('error in accept return :', error.message);
    }
}


//product returned
const productReturned = async (req, res) => {
    try {

        const orderId = req.params.orderId;
        const productId = req.params.productId;

        const order = await orderModel.findOne({
            _id: orderId,
            'productItems._id': productId
        })

        console.log('payment:', order.paymentMethod)



        if (!order) {
            console.log('order not found');
            return res.status(404).json({ message: 'Order not found' });
        }


        const product = order.productItems.find(item => item._id.toString() === productId)

        if (!product) {
            console.log('product not found');
            return res.status(404).json({ message: 'Product not found in order' });
        }
        const total = product.total;
        let amount= total
        if(order.couponDiscount>0 ){
        const discountPercentage = Math.round((order.couponDiscount *100)/order.originalPrice)
        console.log('discouont percentage:',discountPercentage)
        amount = Math.round(total *(100-discountPercentage)/100)
        }
        console.log('amount:',amount)
        const userData = await userModel.findById(order.userId);
        userData.wallet += amount;
        await userData.save();
        // Save wallet transaction
        const wallet = new walletModel({
            userId: order.userId,
            amount: amount,
            type: 'credit',
            description: 'Product returned'
        });
        await wallet.save();
        console.log('Wallet updated successfully');

        product.status = 'product returned'
        await order.save();
        res.json({ success: true })



    } catch (error) {
        console.log('product return status error :', error.message);
        return res.status(404).json({ message: 'Error occured, while retuned status updating.' });
    }
}
module.exports = {
    orderList,
    orderStatus,
    returnManagement,
    viewOrder,
    acceptReturn,
    rejectReturn,
    productReturned
}