const songService = require('../services/songService');

const url = require('url');
exports.add = async (req, res) => {
    return songService.create(req.body, req.user, res)
}

exports.list = async(req, res) => {
    const parsedUrl = url.parse(req.url, true);
    return songService.list(parsedUrl, req.user, res)
}

exports.upload = async(req, res) => {
   return songService.send(req, res);
};

exports.creators = async(req, res) => {
    return songService.creators(req.user, res);
}

exports.uploadFileChunk = async (req, res) => {
    // if(songService.create()){

    // }
    return songService.addTrack(req, res);
}