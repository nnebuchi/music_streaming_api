const express = require('express');
const songRouter = express.Router();
const {verifyAuthToken} = require('../utils/auth');
const songController = require('../controllers/songController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {uploadTrackFile} = require('../services/fileService');
// const {storage} = require('../services/fileService');


// songRouter.post('/add', verifyAuthToken, songController.add);

songRouter.post('/upload', verifyAuthToken, uploadTrackFile.single('file_chunk'), songController.uploadFileChunk);
songRouter.get('/list', verifyAuthToken, songController.list);
songRouter.get('/creators', verifyAuthToken, songController.creators);

module.exports = songRouter;