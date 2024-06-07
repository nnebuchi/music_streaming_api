const express = require('express');
const authRouter = express.Router();
const userAuthController = require('../controllers/userAuthController');

authRouter.post('/register', userAuthController.createUser);

module.exports = authRouter;
