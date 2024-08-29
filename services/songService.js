const { PrismaClient } = require('@prisma/client');
const prisma  = new PrismaClient();
const multer = require('multer');
const formidable = require('formidable');
const disk = require('../utils/storage');
const path = require('path');
const storageHelper = require('../utils/storage');
const file_config = require('../config/filesystem');
const file_disks = file_config.storage;
// const fs = require('fs');
const fs = require('fs-extra');
const {creatorCast, excludeCast} = require('../utils/auth');

exports.create = async(song_data, user) => {

    try {
        const add_song_data = await prisma.songs.create({
            data: song_data
        });
        return add_song_data
        // return res.status(200).json({ 
        //     status: 'success',
        //     message: 'Song Uploaded',
        //     data: add_song_data
        // })
    } catch (error) {
      console.log(error);
      
      return false;
        // return res.status(400).json({ 
        //     status: 'fail',
        //     message: 'upload failed',
        //     error: error
        // })
    }
}

exports.addTrack = async (req, res, disk = 'local') => {
  const { originalname, chunkIndex, totalChunks, uploadId } = req.body;
    const tempPath = req.file.path;
    let uploadDir = file_disks[disk]['root'];
    let tempUploadDir =  path.join(uploadDir, "tracks");
    // path.join(__dirname, 'uploads', uploadId);
    const finalPath = path.join(tempUploadDir, originalname);

    // Ensure the upload directory exists
    await fs.ensureDir(tempUploadDir);

    // Append the chunk to the final file
    fs.appendFileSync(finalPath, fs.readFileSync(tempPath));

    // Remove the temporary chunk file
    await fs.remove(tempPath);

    // Check if this is the last chunk
    if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
        // Optionally, you can do something with the final file here
        console.log(`Upload completed: ${finalPath}`);
    }

    // return 'chunk uploaded'
    return res.status(200).json({
      status:'success',
      message:"chunk uploaded"
    })
}

exports.list = async(parsedUrl, user, res) => {

  try {
    const queryString = parsedUrl.query;
    
    const query = {}
    where = {}
    if( queryString.creator_id){
      where.user_id = parseInt(queryString.creator_id);
    }

    query.where = where;
    
    if(queryString.latest && queryString.latest == "true"){
      query.orderBy = {id:"desc"}
    }

    const page = queryString.page ? parseInt(queryString.page) : 1;
    const page_size = parseInt(process.env.TRACK_PER_PAGE);

    query.skip = (page - 1) * page_size;
    query.take = page_size;
    
    const tracks = await prisma.tracks.findMany(query);
    if(tracks){
      const totalTracksCount = await prisma.tracks.count();
      const totalPages = Math.ceil(totalTracksCount / page_size);
      const paginatedResult = {
        tracks: tracks,
        meta: {
          total: totalTracksCount,
          page,
          last_page: totalPages,
          page_size,
          nextPage:page === totalPages ? null : page + 1,
        },
      };
      return res.status(200).json({
        status:'success',
        data:paginatedResult
      })
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status:'fail',
      error:error,
      message:"Could not fetch tracks."
    })
  }
  
  
}


exports.creators = async (user, res) => {
  const all_creators = await prisma.users.findMany({
    where: {
      is_artise: true,
      id: {
        not: user.id
      } 
    },
    include: {  
      socialProfiles: {
        select: { 
          id: true, 
          url:true, 
          social:{
            select: { 
              title: true,
              logo:true,
              slug:true
            }
          }
        },
        
      }, 
    }
  })
  if(all_creators){
    
    const formattedCreatorList = []
    all_creators.forEach(async (creator) => {
    await excludeCast(creator, creatorCast)
    .then(formattedCreator => {
      console.log(formattedCreator);
      
      formattedCreatorList.push(formattedCreator)
      return res.status(200).json({ 
        status: 'success',
        data: formattedCreatorList
      })
    }
    )
    });

    
  }

  
}


/*

if(all_creators){
    
    const formattedCreatorList = []
    all_creators.forEach(async (creator) => {
    await excludeCast(creator, creatorCast)
    .then(formattedCreator => {
      console.log(formattedCreator);
      
      formattedCreatorList.push(formattedCreator)
      return res.status(200).json({ 
        status: 'success',
        data: formattedCreatorList
      })
    }
    )
    });

    
  }
*/