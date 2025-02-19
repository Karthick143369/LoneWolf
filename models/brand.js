const mongoose =require('mongoose');


const brandSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String
    }
})



module.exports = mongoose.model('brands', brandSchema);
