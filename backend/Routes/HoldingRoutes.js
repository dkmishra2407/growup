const router = require('express').Router();
const  holdingController  = require('../Controller/HoldingController');

router.get('/getholding/:HoldingId', holdingController.getHoldings);



module.exports = router;