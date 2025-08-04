const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema({
    HoldingId: {
        type: String,
        required: true
    },
    Holdings: [
        {
            Name: {
                type: String,
                required: true
            },
            Symbol: {
                type: String,
                required: true
            },
            Quantity: {
                type: Number,
                required: true
            },
            Price: {
                type: Number,
                required: true
            },
            Date: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

module.exports = mongoose.model('Holding', HoldingSchema);