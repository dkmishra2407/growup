const router = require('express').Router();
const  watchlistController  = require('../Controller/WatchlistController');

router.get('/getwatchlist/:WatchlistId', watchlistController.getWatchlist);
router.post('/addwatchlist', watchlistController.addToWatchlist);
router.delete('/remove', watchlistController.removeFromWatchlist);

module.exports = router;