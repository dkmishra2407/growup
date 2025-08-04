const UserController = require('../Controller/UserController');
const express = require('express');
const router = express.Router();

router.post('/register',UserController.registerUser);
router.post('/login',UserController.loginUser);

module.exports = router;