const songService = require('../services/songService');
const { runValidation } = require('../lib/buchi');

const url = require('url');
exports.add = async (req, res) => {
    const add_track_data = await songService.create(req.body, req.user);
    if(add_track_data.status){
        return res.status(200).json({
            status:'success',
            message:"track successfully added",
            data: add_track_data.data
        })
    }else{
        return res.status(400).json({
            status:'fail',
            error:add_track_data.error,
            message:"Adding track failed"
        })
    }
}

exports.list = async(req, res) => {
    const parsedUrl = url.parse(req.url, true);
    return songService.list(parsedUrl, req.user, res)
}

exports.guest_list = async(req, res) => {
    const parsedUrl = url.parse(req.url, true);
    return songService.guest_list(parsedUrl, req.user, res)
}
exports.upload = async(req, res) => {
   return songService.send(req, res);
};

exports.creators = async(req, res) => {
    return songService.creators(req, res);
}

exports.uploadFileChunk = async (req, res) => {
    const {track_id} = req.body
        const validate = await runValidation([
            {
                input: { value: track_id, field: "track_id", type: "text" },
                rules: { required: true},
            }
        ])
        if(validate){
            if(validate?.status === false) {
            return res.status(409).json({
                status:"fail",
                errors:validate.errors,
                message:"Request Failed",
            });
            }else{
                
                return songService.addTrackFile(req, res);
            }
        }
    
}

exports.genres = async (req, res) => {
    return songService.genres(res);
}

exports.addTrackCoverPhoto = async (req, res) => {
    
    
    if (req.file) {
        const {track_id} = req.body
        const validate = await runValidation([
            {
                input: { value: track_id, field: "track_id", type: "text" },
                rules: { required: true},
            }
        ])
        if(validate){
            if(validate?.status === false) {
            return res.status(409).json({
                status:"fail",
                errors:validate.errors,
                message:"Request Failed",
            });
            }else{
                
                return songService.addTrackCoverPhoto(track_id, req.file, res)
            }
        }
        
    }else {
        // No file uploaded
        return res.status(400).json({
            status:'fail',
            message:"Cover photo field is required",
            error:'No file uploaded.'
        });
    }
   
}

exports.likeTrack = async (req, res) => {
    const {track_id} = req.params
    const user_id = req.user.id;
    const validate = await runValidation([
        {
            input: { value: track_id, field: "track_id", type: "text" },
            rules: { required: true},
        }
    ])
    if(validate){
        if(validate?.status === false) {
        return res.status(409).json({
            status:"fail",
            errors:validate.errors,
            message:"Request Failed",
        });
        }else{
            
            return await songService.likeTrack(
                {
                    track_id:parseInt(track_id),
                    user_id:parseInt(user_id)
                }, 
                res
            );
        }
    }
    
}


exports.playTrack = async (req, res) => {
    const {track_id} = req.params
    const parsedUrl = url.parse(req.url, true);
    return songService.playTrack(track_id, parsedUrl, req.user, res)
}