const express = require('express');
const authRouter = express.Router();
const userAuthController = require('../controllers/userAuthController');

authRouter.post('/register', userAuthController.createUser);
authRouter.post('/login', userAuthController.loginUser);
// authRouter.post('/login', userAuthController.loginUser);
module.exports = authRouter;
