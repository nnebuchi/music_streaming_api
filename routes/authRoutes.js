const express = require('express');
const authRouter = express.Router();
const {verifyAuthToken} = require('../utils/auth');
const userAuthController = require('../controllers/userAuthController');

authRouter.post('/register', userAuthController.createUser);
authRouter.post('/login', userAuthController.loginUser);
authRouter.post('/verify-otp', userAuthController.verifyOtp);
authRouter.post('/send-otp', userAuthController.sendOtp);
authRouter.post('/logout', verifyAuthToken, userAuthController.logoutUser);


module.exports = authRouter;
