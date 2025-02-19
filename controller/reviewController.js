const reviewModel = require('../models/review');

const reviewProduct = async (req, res) => {
    try {
        const { rating, review, productId, userId } = req.body;
        const existingReview = await reviewModel.findOne({ userId, productId });

        if (existingReview) {
            existingReview.rating = rating;
            existingReview.review = review;

            await existingReview.save();
            res.status(200).json({ success: 'review updated' })

        } else {
            const newReview = new reviewModel({
                productId,
                userId,
                rating,
                review
            })
            await newReview.save();
            console.log('new review items are:', newReview);
            res.status(200).json({ success: 'review updated' })
        }

    } catch (error) {
        console.log('error in review a product:', error.message);
        res.status(500).json({ error: 'Failed to review product' });
    }
}

module.exports = {
    reviewProduct
}