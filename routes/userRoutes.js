const express = require('express');
const userRouter = express.Router();
const {verifyAuthToken} = require('../utils/auth');
const userController = require('../controllers/userController');


userRouter.post('/change-password', verifyAuthToken, userController.changePassword);

module.exports = userRouter;