const Watchlist = require('../Models/WatchlistModel');

module.exports.getWatchlist = async (req, res) => {
    try {
        const { WatchlistId } = req.params;
        const watchlist = await Watchlist.findOne({ WatchlistId });

        if (!watchlist) {
            return res.status(404).json({ msg: 'Watchlist not found' });
        }

        return res.status(200).json({ watchlist });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.addToWatchlist = async (req, res) => {
    try {
        const { WatchlistId, stockName } = req.body;

        if (!WatchlistId || !stockName) {
            return res.status(400).json({ msg: 'WatchlistId and stockName are required' });
        }

        let watchlist = await Watchlist.findOne({ WatchlistId });

        if (!watchlist) {
            // Create new watchlist if it doesn't exist
            watchlist = new Watchlist({
                WatchlistId,
                Names: [stockName]
            });
            await watchlist.save();
            return res.status(201).json({ 
                msg: 'Watchlist created and stock added', 
                watchlist 
            });
        }

        // Check if stock already exists in watchlist
        if (watchlist.Names.includes(stockName)) {
            return res.status(400).json({ msg: 'Stock already in watchlist' });
        }

        // Add stock to existing watchlist
        watchlist.Names.push(stockName);
        await watchlist.save();

        return res.status(200).json({ 
            msg: 'Stock added to watchlist', 
            watchlist 
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ msg: err.message });
    }
};

module.exports.removeFromWatchlist = async (req, res) => {
    try {
        const { id,stockName } = req.body;

        if (!stockName) {
            return res.status(400).json({ msg: 'stockName is required' });
        }

        const watchlist = await Watchlist.findOne({ WatchlistId: id });

        if (!watchlist) {
            return res.status(404).json({ msg: 'Watchlist not found' });
        }

        // Check if stock exists in watchlist
        if (!watchlist.Names.includes(stockName)) {
            return res.status(404).json({ msg: 'Stock not found in watchlist' });
        }

        // Remove stock from watchlist
        watchlist.Names = watchlist.Names.filter(name => name !== stockName);
        await watchlist.save();

        return res.status(200).json({ 
            msg: 'Stock removed from watchlist', 
            watchlist 
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ msg: err.message });
    }
};