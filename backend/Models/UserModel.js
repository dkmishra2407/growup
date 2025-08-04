const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Password: {
        type: String,
        required: true
    },
    Date: {
        type: Date,
        default: Date.now
    },
    Balance: {
        type: Number,
        default: 10000
    },
    ExchangeId: {
        type: String,
        required: true
    },
    WatchlistId: {
        type: String,
        required: true
    },
    HoldingId: {
        type: String,
        required: true
    },
    MobileNo: {
        type: Number,
        required: true
    },
    Username: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('User', UserSchema);