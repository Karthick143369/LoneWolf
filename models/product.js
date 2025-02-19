const mongoose =require('mongoose');


const productSchema = new mongoose.Schema({
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductOffer'
    },
    productName:{
        type:String,
        unique: true,
        required: true,
    },
    price:{
        type:Number,
        required:true,
    },
    images:{
        type:[String],

    },
    stock:{
        type:Number,
        required:true
    },
    rating:{
        type:Number,
        required:false
    },
    brand:{
        type : mongoose.Schema.Types.ObjectId,
        ref: 'brands'
    },
    category:{
        type : mongoose.Schema.Types.ObjectId,
        ref: 'category'
    },
    FitType:{
        type:String,
        required:true
    },
    colour:{
        type:String,
        required:true
    },
    size:{
        type:String,
        required:true
    },
    Description:{
        type:String,
        required:true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    isWishlist:{
        type:Boolean,
        default:false
    },
})

function arrayLimit(val){
    return val.length <4;
}

module.exports = mongoose.model('product',productSchema)
