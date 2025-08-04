const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema({
    WatchlistId: {
        type: String,
        required: true
    },
    Names: {
        type: [String],  // Array of strings
        required: true,
        default: []      // Default to empty array
    }
});

module.exports = mongoose.model('Watchlist', WatchlistSchema);