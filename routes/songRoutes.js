const express = require('express');
const songRouter = express.Router();
const trackRouter = express.Router();
const artisteRouter = express.Router();
const {verifyAuthToken} = require('../utils/auth');
const songController = require('../controllers/songController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {uploadTrackFile, uploadTrackCoverPhoto} = require('../services/fileService');
// const {storage} = require('../services/fileService');


// songRouter.post('/add', verifyAuthToken, songController.add);
// Track Routes
songRouter.use('/tracks', trackRouter);

    trackRouter.get('/', verifyAuthToken, songController.list);
    trackRouter.post('/add', verifyAuthToken, songController.add);
    trackRouter.post('/upload', verifyAuthToken, uploadTrackFile.single('file_chunk'), songController.uploadFileChunk);
    trackRouter.post('/upload-cover', verifyAuthToken, uploadTrackCoverPhoto.single('cover_photo'), songController.addTrackCoverPhoto);

songRouter.use('/creators', artisteRouter);
    artisteRouter.get('/', verifyAuthToken, songController.creators);


// songRouter.get('/list', verifyAuthToken, songController.list);
// songRouter
songRouter.get('/genres', songController.genres);



module.exports = songRouter;