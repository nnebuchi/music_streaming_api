const express = require('express');
const userRouter = express.Router();
const {verifyAuthToken} = require('../utils/auth');
const userController = require('../controllers/userController');
const {uploadProfilePhoto, uploadCoverPhoto} = require('../services/fileService');

// const ProfileRoutes = express.R

// userRouter.use('/profile', ProfileRoutes);
userRouter.get('/profile', verifyAuthToken, userController.profile);
userRouter.post('/profile/update', verifyAuthToken, userController.updateProfile);
userRouter.get('/profile/socials',verifyAuthToken, userController.socials);
userRouter.post('/profile/socials/update', verifyAuthToken, userController.updateSocials);
userRouter.post('/change-password', verifyAuthToken, userController.changePassword);
userRouter.get('/delete-account', verifyAuthToken, userController.deleteAccount);
userRouter.post('/update-profile-photo', verifyAuthToken, uploadProfilePhoto.single('photo'), userController.updateProfilePhoto);
userRouter.post('/update-cover-photo', verifyAuthToken, uploadCoverPhoto.single('photo'), userController.updateCoverPhoto);

module.exports = userRouter;