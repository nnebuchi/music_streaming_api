const { PrismaClient } = require('@prisma/client');
const prisma  = new PrismaClient();
const multer = require('multer');
const formidable = require('formidable');
const disk = require('../utils/storage');
const path = require('path');
const storageHelper = require('../utils/storage');
const fs = require('fs');
const {creatorCast, excludeCast} = require('../utils/auth');

exports.create = async(song_data, user, res) => {

    try {
        const add_song_data = await prisma.songs.create({
            data: song_data
        });
        return res.status(200).json({ 
            status: 'success',
            message: 'Song Uploaded',
            data: add_song_data
        })
    } catch (error) {
        return res.status(400).json({ 
            status: 'fail',
            message: 'upload failed',
            error: error
        })
    }
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

exports.upload =  async (req, res) => {
    try {
       
        const form = new formidable.IncomingForm();
        
       form.parse(req, async (err, fields, files) => {
            
          if (err) {
            console.error(err);
            return res.status(500).json({ 
                error: 'Error parsing form data' 
            });
          }
          const chunkIndex = parseInt(fields.chunkIndex);
          const totalChunks = parseInt(fields.totalChunks);
    
          await storageHelper.saveChunk(files.file, chunkIndex, totalChunks);
    
          res.json({ message: 'Chunk uploaded successfully' });
        });


      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error uploading chunk' });
      }
    // try {
    //   const filePath = await storageHelper.put(req.file, 'local'); // or 's3'

    //   res.json({ filePath });
    // } catch (error) {
    //   console.error(error);
    //   res.status(500).json({ error: 'Upload failed' });
    // }
  }


  exports.send = async (req, res) => {
    const { file, body: { totalChunks, currentChunk } } = req;
    console.log(file);
    const diskConfig = storageHelper.getDisk('local');
    const filePath = path.join(diskConfig.root, `temp/${file.originalname}_${chunkIndex}`)
    const chunkFilename = `${file.originalname}.${currentChunk}`;
    const chunkPath = `/public/uploads/${chunkFilename}`;
    fs.rename(file.path, chunkPath, (err) => {
      if (err) {
        console.error('Error moving chunk file:', err);
        res.status(500).send('Error uploading chunk');
      } else {
        if (+currentChunk === +totalChunks) {
          // All chunks have been uploaded, assemble them into a single file
          assembleChunks(file.originalname, totalChunks)
            .then(() => res.send('File uploaded successfully'))
            .catch((err) => {
              console.error('Error assembling chunks:', err);
              res.status(500).send('Error assembling chunks');
            });
        } else {
          res.send('Chunk uploaded successfully');
        }
      }
    });
  }
  

  async function assembleChunks(filename, totalChunks) {
    const writer = fs.createWriteStream(`./uploads/${filename}`);
    for (let i = 1; i <= totalChunks; i++) {
      const chunkPath = `${CHUNKS_DIR}/${filename}.${i}`;
      await pipeline(pump(fs.createReadStream(chunkPath)), pump(writer));
      fs.unlink(chunkPath, (err) => {
        if (err) {
          console.error('Error deleting chunk file:', err);
        }
      });
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