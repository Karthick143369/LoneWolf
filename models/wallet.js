const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userLogin',
        required: true
    },
    amount : {
        type: Number,
        required : true
    },
    type: {
        type: String,
        enum : ['debit','credit'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
  
})


module.exports = mongoose.model('WalletTransaction', WalletSchema);