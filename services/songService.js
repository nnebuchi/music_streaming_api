const { PrismaClient } = require('@prisma/client');
const prisma  = new PrismaClient();
const multer = require('multer');
const formidable = require('formidable');
const path = require('path');
const {processPath} = require('../utils/file');
const file_config = require('../config/filesystem');
const file_disks = file_config.storage;
// const fs = require('fs');
const fs = require('fs-extra');
const {creatorCast} = require('../utils/auth');
const { excludeCast} = require('../utils/generic');
const {songCast} = require('../utils/songs')
const {removeDiskPath} = require('../utils/file');
const {slugify} = require('../utils/generic');

exports.create = async(song_data, user) => {
    try {
      if(typeof song_data.featured != 'object' ){
        return {
          status: false,
          error:"featured field must be an array"
        }
      }
        const genres = song_data.genres;
        delete song_data.genres;
        song_data.featured = typeof song_data.featured == 'object' ? song_data.featured.toString() : NULL ;
        song_data.user_id = user.id;
        song_data.slug = await slugify(song_data?.title);
        const add_song_data = await prisma.tracks.create({
            data: song_data
        });
        if(add_song_data){
          
          genres.forEach(async (genre) => {
            
            await prisma.trackToGenres.create({
              data: {
                track_id:add_song_data.id,
                genre_id: parseInt(genre)
              }
            });
            
          });

          return {
            status: true,
            message:'track added successfully',
            data: add_song_data
          }
        }  
    } catch (error) {
      console.log(error);
      
      return {
        status: false,
        error:error
      }
      
    }
}

exports.addTrackCoverPhoto = async (track_id, file, res) => {
  const cover_path = await processPath(file);
  const update_track = await this.update(track_id, {cover:cover_path});
  // console.log(update_track);
  
  if(update_track.status){
    
    return res.status(200).json({
      status: 'success',
      message: "cover photo updated"
    });
  }else{

    return res.status(400).json({
      status: 'fail',
      message: update_track.message,
      error:update_track.error
    });
  }
}

exports.update = async (track_id, song_data) => {
  try {
    // Find the track by ID
    const track = await prisma.tracks.findUnique({
      where: {
        id: parseInt(track_id)
      }
    });

    if (!track) {
     
      return {
        status: false,
        error: "Track not found"
      };
    }

    console.log(song_data);
    // Remove fields that are not supposed to be updated
    song_data = await excludeCast(song_data, songCast);
    
    const genres = song_data.genres; // Save potential genres

    if (genres) {
      delete song_data.genres; // Remove genres from song_data for the update

      // Delete existing genre associations
      await prisma.trackToGenres.deleteMany({
        where: {
          track_id: track_id,
        }
      });

      // Add new genre associations
      for (const genre of genres) {
        await prisma.trackToGenres.create({
          data: {
            track_id: track_id,
            genre_id: parseInt(genre)
          }
        });
      }
    }
    
    // If there are still fields in song_data to update
    if (Object.keys(song_data).length > 0) {
      console.log('updating');
      
      const updatedTrack = await prisma.tracks.update({
        where: {
          id: parseInt(track_id)
        },
        data: song_data
      });

      return {
        status: true,
        message: 'Track updated successfully',
        data: updatedTrack
      };
    }

    return {
      status: true,
      message: 'Track updated successfully, but no song data provided for update'
    };

  } catch (error) {
    console.log(error);
    return {
      status: false,
      error: error.message || "An error occurred"
    };
  }
};

exports.addTrackFile = async (req, res, disk = 'local') => {
  const { originalname, chunkIndex, totalChunks, track_id } = req.body;
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
        const songFile = await removeDiskPath(finalPath);
        console.log(`Upload completed: ${songFile}`);
        const save_file_on_db = await this.update(track_id, {file: songFile})
        
        if((save_file_on_db).status){
          return res.status(200).json({
            status:'success',
            message:"chunk uploaded",
            completed: true,
            file_path: songFile
          })
        }else{
          return res.status(200).json({
            status:'fail',
            error: save_file_on_db.error
          })
        } 
    }
    let percentage_upload = 100 * ((parseFloat(chunkIndex) + 1)/parseFloat(totalChunks));

     console.log("upload progress: "+ Math.round(percentage_upload)+"%");
     
    // return 'chunk uploaded'
    return res.status(200).json({
      status:'success',
      message:"chunk uploaded",
      completed: false
    })
}

// exports.list = async(parsedUrl, user, res) => {

//   try {
//     const queryString = parsedUrl.query;
//     console.log(queryString);
    
//     const query = {}
//     where = {}
//     if( queryString.creator_id){
//       where.user_id = parseInt(queryString.creator_id);
//     }

//     if(queryString.genre){
//       where.genres =  { some: { genre: { id: parseInt(queryString.genre) } } } 
//     }

//     query.where = where;
    
//     if(queryString.latest && queryString.latest == "true"){
//       query.orderBy = {id:"desc"}
//     }

//     const page = queryString.page ? parseInt(queryString.page) : 1;
//     const page_size = parseInt(process.env.TRACK_PER_PAGE);

//     query.skip = (page - 1) * page_size;
//     query.take = page_size;
    
//     const tracks = await prisma.tracks.findMany(query);
//     if(tracks){
//       const totalTracksCount = await prisma.tracks.count();
//       const totalPages = Math.ceil(totalTracksCount / page_size);
//       const paginatedResult = {
//         tracks: tracks,
//         meta: {
//           total: totalTracksCount,
//           page,
//           last_page: totalPages,
//           page_size,
//           nextPage:page === totalPages ? null : page + 1,
//         },
//       };
//       return res.status(200).json({
//         status:'success',
//         data:paginatedResult
//       })
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json({
//       status:'fail',
//       error:error,
//       message:"Could not fetch tracks."
//     })
//   }
  
  
// }

exports.list = async (parsedUrl, user, res) => {
  try {
    const queryString = parsedUrl.query;
    console.log(queryString);

    const query = {};
    let where = {};

    if (queryString.creator_id) {
      where.user_id = parseInt(queryString.creator_id);
    }

    if (queryString.genre) {
      where.genres = { some: { genre: { id: parseInt(queryString.genre) } } };
    }

    // Check for the 'like' query string
    if (queryString.like && queryString.like === 'true') {
      // If authenticated user is present, filter by liked tracks
      if (user) {
        where.likes = { some: { user: { id: user.id } } };
      } else {
        // Handle case where user is not authenticated (return empty list)
        return res.status(200).json({
          status: 'success',
          data: { tracks: [], meta: { total: 0, page: 1, last_page: 1, page_size: 10, nextPage: null } }
        });
      }
    }

    query.where = where;

    if (queryString.latest && queryString.latest === 'true') {
      query.orderBy = { id: 'desc' };
    }

    const page = queryString.page ? parseInt(queryString.page) : 1;
    const page_size = parseInt(process.env.TRACK_PER_PAGE);

    query.skip = (page - 1) * page_size;
    query.take = page_size;

    const tracks = await prisma.tracks.findMany(query);
    if (tracks) {
      const totalTracksCount = await prisma.tracks.count();
      const totalPages = Math.ceil(totalTracksCount / page_size);
      const paginatedResult = {
        tracks: tracks,
        meta: {
          total: totalTracksCount,
          page,
          last_page: totalPages,
          page_size,
          nextPage: page === totalPages ? null : page + 1,
        },
      };
      return res.status(200).json({
        status: 'success',
        data: paginatedResult,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 'fail',
      error: error,
      message: 'Could not fetch tracks.',
    });
  }
};


exports.creators = async (user, res) => {
  try {
    const allCreators = await prisma.users.findMany({
      where: {
        is_artise: true,
        NOT: { id: user.id }, // More concise negation
      },
      include: {
        socialProfiles: {
          select: {
            id: true,
            url: true,
            social: {
              select: {
                title: true,
                logo: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (allCreators.length) {
      const formattedCreators = await Promise.all(
        allCreators.map(async (creator) => {
          const formattedCreator = await excludeCast(creator, creatorCast);
          return formattedCreator;
        })
      );

      return res.status(200).json({
        status: 'success',
        data: formattedCreators,
      });
    } else {
      // Handle empty creators case (optional)
      return res.status(200).json({
        status: 'success',
        data: [], // Empty array
        message: 'No creators found', // Informative message
      });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error', // Generic error message for user
    });
  }
};


exports.genres = async (res) => {
  return res.status(200).json({
    status:'success',
    data:await prisma.genres.findMany({})
  });
}
exports.likeTrack = async (req_data, res) => {
  const {track_id, user_id} = req_data
  // const {user_id} = req.user.id;
  try {
    const existingLike = await prisma.trackLike.findMany({
      where: { track_id, user_id },
    });

    if (existingLike.length > 0) {
       await prisma.trackLike.deleteMany({
        where: { track_id, user_id },
      });
      return res.status(400).json({status:"success", message: 'unliked' });
    }else{
      await prisma.trackLike.create({
        data: { track_id, user_id },
      });
      return res.status(400).json({status:"success", message: 'liked' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error liking track' });
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