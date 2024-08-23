const express = require('express');
const userRouter = express.Router();
const {verifyAuthToken} = require('../utils/auth');
const userController = require('../controllers/userController');
const {uploadFile} = require('../services/fileService');

// const ProfileRoutes = express.R

// userRouter.use('/profile', ProfileRoutes);
userRouter.get('/profile', verifyAuthToken, userController.profile);
userRouter.post('/profile/update', verifyAuthToken, userController.updateProfile);
userRouter.get('/profile/socials',verifyAuthToken, userController.socials);
userRouter.post('/profile/socials/update', verifyAuthToken, userController.updateSocials);
userRouter.post('/change-password', verifyAuthToken, userController.changePassword);
userRouter.get('/delete-account', verifyAuthToken, userController.deleteAccount);
userRouter.post('/update-profile-photo', verifyAuthToken, uploadFile.single('photo'), userController.updateProfilePhoto);

module.exports = userRouter;