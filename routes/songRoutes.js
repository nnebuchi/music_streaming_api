const express = require('express');
const songRouter = express.Router();
const {verifyAuthToken} = require('../utils/auth');
const songController = require('../controllers/songController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
// const {storage} = require('../services/fileService');


// songRouter.post('/add', verifyAuthToken, songController.add);
const upload = multer();

songRouter.post('/upload', upload.single('track'), songController.upload);
songRouter.get('/list', verifyAuthToken, songController.list);
songRouter.get('/creators', verifyAuthToken, songController.creators);

module.exports = songRouter;