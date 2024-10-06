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
                const disk = process.env.ACTIVE_DISK ? process.env.ACTIVE_DISK : 'local';
                const type =  req.body.type ? req.body.type : 'audio';
                return songService.addTrackFile(req, res, disk, type );
            }
        }
    
}

exports.genres = async (req, res) => {
    return songService.genres(res);
}

exports.addTrackCoverPhoto = async (req, res) => {
    
    if (req.file) {
        const directory = 'track_covers';
        const track_id = req.body.track_id
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
                
                // return songService.addTrackCoverPhoto(track_id, req.file, res)
                return songService.handleTrackCover(req, directory, res)
            }
        }
        
    }else {
        // No file uploaded
        return res.status(400).json({
            status:'fail',
            message:"No file uploaded.",
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

exports.recordPlayback = async (req, res) => {
    
    const track_id = req.body.track_id
    // console.log(track_id);
    
    const type = req.body.type
    const validate = await runValidation([
        {
            input: { value: track_id.toString(), field: "track_id", type: "text" },
            rules: { required: true},
        },
        {
            input: { value: type, field: "type", type: "text" },
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
            return songService.recordPlayback( req.user, track_id, type, res)
        }
    }
    
}


exports.updatePlayDuration = async (req, res) => {
    const track_id = req.body.track_id
    const play_id = req.body.play_id
    const duration = req.body.duration
    const validate = await runValidation([
        {
            input: { value: track_id, field: "track_id", type: "text" },
            rules: { required: true},
        },
        {
            input: { value: play_id, field: "play_id", type: "text" },
            rules: { required: true},
        },
        {
            input: { value: duration, field: "duration", type: "text" },
            rules: { required: true},
        }
    ]);
    if(validate){
        if(validate?.status === false) {
            return res.status(409).json({
                status:"fail",
                errors:validate.errors,
                message:"Request Failed",
            });
        }else{
            return songService.updatePlayDuration(req.user, track_id, play_id, duration, res)
        }
    }
    // const parsedUrl = url.parse(req.url, true);
    
}


exports.updatePlayStatus = async (req, res) => {
    const track_id = req.body.track_id
    const play_id = req.body.play_id
    const status = req.body.status
    const validate = await runValidation([
        {
            input: { value: track_id, field: "track_id", type: "text" },
            rules: { required: true},
        },
        {
            input: { value: play_id, field: "play_id", type: "text" },
            rules: { required: true},
        },
        {
            input: { value: status, field: "status", type: "text" },
            rules: { required: true},
        }
    ]);

    if(validate){
        if(validate?.status === false) {
            return res.status(409).json({
                status:"fail",
                errors:validate.errors,
                message:"Request Failed",
            });
        }else{
            return songService.updatePlayStatus(req.user, track_id, play_id, status, res)
        }
    }
    
}