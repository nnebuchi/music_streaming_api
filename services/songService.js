const { PrismaClient } = require('@prisma/client');
const prisma  = new PrismaClient();
const multer = require('multer');
const formidable = require('formidable');
const disk = require('../utils/storage');
const path = require('path');
const storageHelper = require('../utils/storage');
const fs = require('fs');

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
    // console.log(where);
    
    if(queryString.latest && queryString.latest == true){
      query.orderBy = {createdAt:"desc"}
    }

    
    const tracks = await prisma.tracks.findMany(query);
    if(tracks){
      return res.status(200).json({
        status:'success',
        data:tracks
      })
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status:'fail',
      error:errorMonitor,
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

