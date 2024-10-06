const express = require('express');
const songRouter = express.Router();
const trackRouter = express.Router();
const artisteRouter = express.Router();
const {verifyAuthToken, addAuthToken} = require('../utils/auth');
const {validateTrackOwnership} = require('../utils/songs');
const songController = require('../controllers/songController');
const creatorController = require('../controllers/creatorController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {uploadTrackFile, uploadTrackCoverPhoto, uploadFile} = require('../services/fileService');
// const {storage} = require('../services/fileService');


// songRouter.post('/add', verifyAuthToken, songController.add);
// Track Routes
songRouter.use('/tracks', trackRouter);
    trackRouter.get('/', verifyAuthToken, songController.list);
    trackRouter.get('/guest-list', songController.list);
    trackRouter.post('/add', verifyAuthToken, songController.add);
    trackRouter.post('/upload', verifyAuthToken, uploadTrackFile.single('file_chunk'), songController.uploadFileChunk);
    trackRouter.post('/upload-cover', verifyAuthToken,  uploadFile('uploads/track_covers').single('cover_photo'), validateTrackOwnership, songController.addTrackCoverPhoto);
    trackRouter.post('/:track_id/like', verifyAuthToken, songController.likeTrack);
    trackRouter.get('/:track_id/play', verifyAuthToken, songController.playTrack);
    trackRouter.post('/record-playback', verifyAuthToken, songController.recordPlayback);
    trackRouter.post('/pause-or-play', verifyAuthToken, songController.updatePlayStatus);
    trackRouter.post('/update-playback-duration', verifyAuthToken, songController.updatePlayDuration);
// Artise Routes
songRouter.use('/creators', artisteRouter);
    artisteRouter.get('/', addAuthToken, songController.creators);
    artisteRouter.post('/follow', verifyAuthToken, creatorController.addFollower);
// songRouter.get('/list', verifyAuthToken, songController.list);
// songRouter
songRouter.get('/genres', songController.genres);



module.exports = songRouter;