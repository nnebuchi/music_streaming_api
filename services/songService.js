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


exports.addTrackFile = async (req, res, disk = 'local', type='audio') => {
  const { originalname, chunkIndex, totalChunks, track_id } = req.body;
  const tempPath = req.file.path;
  let uploadDir = file_disks[disk]['root'];
  let tempUploadDir = path.join(uploadDir, "tracks");
  const finalPath = path.join(tempUploadDir, originalname);

  // Ensure the upload directory exists
  await fs.ensureDir(tempUploadDir);

  // Append the chunk to the final file
  fs.appendFileSync(finalPath, fs.readFileSync(tempPath));

  // Remove the temporary chunk file
  await fs.remove(tempPath);

  // Check if this is the last chunk
  if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
    // Rename the file after the final chunk is uploaded
    const newFileName = `${Date.now()}_${originalname}`;
    const newFilePath = path.join(tempUploadDir, newFileName);

    try {
      await fs.rename(finalPath, newFilePath);
      console.log(`File renamed to: ${newFileName}`);

      // Optionally, you can do something with the final file here
      const songFile = await removeDiskPath(newFilePath);
      console.log(`Upload completed: ${songFile}`);

      // Update the track in the database with the new file path
      let save_file_on_db = '';
      if(type === 'audio'){
        save_file_on_db = await this.update(track_id, { file: songFile });
      }

      if(type === 'video'){
        save_file_on_db = await this.update(track_id, { file: songFile });
      }
      

      if (save_file_on_db.status) {
        return res.status(200).json({
          status: 'success',
          message: "Chunk uploaded and file renamed",
          completed: true,
          file_path: songFile,
        });
      } else {
        return res.status(200).json({
          status: 'fail',
          error: save_file_on_db.error,
        });
      }
    } catch (error) {
      console.error("Error renaming file:", error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to rename the file after upload.',
      });
    }
  }

  let percentage_upload = 100 * ((parseFloat(chunkIndex) + 1) / parseFloat(totalChunks));
  console.log("Upload progress: " + Math.round(percentage_upload) + "%");

  // Return chunk upload success response
  return res.status(200).json({
    status: 'success',
    message: "Chunk uploaded",
    completed: false,
  });
};


exports.list = async (parsedUrl, user, res) => {
  try {
    const queryString = parsedUrl.query;
    const query = {};
    let where = {};

    if (queryString.creator_id) {
      where.user_id = parseInt(queryString.creator_id);
    }

    if (queryString.genre && queryString?.genre !== 'all') {
      where.genres = { some: { genre: { id: parseInt(queryString.genre) } } };
    }

    // Check for the 'like' query string
    if (queryString.like && queryString.like === 'true') {
      // If authenticated user is present, filter by liked tracks
      if (user) {
        where.likes = { some: { user: { id: parseInt(user.id) } } };
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

    // Include user details (creator of the track)
    query.include = {
      artiste: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_photo: true,
        },
      },
    };

    const tracks = await prisma.tracks.findMany(query);
    if (tracks) {
      const totalTracksCount = await prisma.tracks.count({ where });
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

  exports.guest_list = async (parsedUrl, user, res) => {
    try {
      const queryString = parsedUrl.query;
      const query = {};
      let where = {};

      if (queryString.creator_id) {
        where.user_id = parseInt(queryString.creator_id);
      }

      if (queryString.genre && queryString?.genre !== 'all') {
        where.genres = { some: { genre: { id: parseInt(queryString.genre) } } };
      }

      // Check for the 'like' query string
      if (queryString.like && queryString.like === 'true') {
        // If authenticated user is present, filter by liked tracks
        if (user) {
          where.likes = { some: { user: { id: user.id } } };
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

      // Include user details (creator of the track)
      query.include = {
        artiste: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            profile_photo: true,
          },
        },
      };

      const tracks = await prisma.tracks.findMany(query);
      if (tracks) {
        const sanitizedTracks = tracks.map(track => {
          const { file, ...rest } = track; // Exclude the 'file' property
          return rest;
        });
        const totalTracksCount = await prisma.tracks.count({ where });
        const totalPages = Math.ceil(totalTracksCount / page_size);
        const paginatedResult = {
          tracks: sanitizedTracks,
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


exports.creators = async (req, res) => {
  try {
    console.log(req.user);
    const where = req.user ? {is_artise: true, NOT: { id: req.user?.id } } : {is_artise: true}
    const allCreators = await prisma.users.findMany({
      where: where,
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
        _count: {
          select: {
            followers: true, // Counting the followers
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
// exports.likeTrack = async (req_data, res) => {
//   const {track_id, user_id} = req_data
//   // const {user_id} = req.user.id;
//   try {
//     let message = "";
//     const existingLike = await prisma.trackLike.findMany({
//       where: { track_id, user_id },
//     });

//     if (existingLike.length > 0) {
//        await prisma.trackLike.deleteMany({
//         where: { track_id, user_id },
//       });
//       message = "unliked";
//       // return res.status(200).json({status:"success", message: 'unliked' });
//     }else{
//       await prisma.trackLike.create({
//         data: { track_id, user_id },
//       });
    
//       message = "liked";
//       // return res.status(200).json({status:"success", message: 'liked', data:likedTracks });
//     }

//     const likedTracks = await prisma.trackLike.findMany({
//       where: { user_id },
//     }).map((track) => {
//       return {track_id: track.track_id}
//     });
  

//     return res.status(200).json({status:"success", message: message, data:likedTracks });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Error liking track' });
//   }
// }


exports.likeTrack = async (req_data, res) => {
  const { track_id, user_id } = req_data;

  try {
    const existingLike = await prisma.trackLike.findFirst({
      where: { track_id, user_id },
    });
    let message ="";
    if (existingLike) {
      await prisma.trackLike.delete({
        where: { id:existingLike.id },
      });
      message = "unliked";
    } else {
      await prisma.trackLike.create({
        data: { track_id, user_id },
      });
      message = "liked";
    }

    const likedTracks = await prisma.trackLike.findMany({
      where: { user_id: user_id },
      select: { track_id:true },
    });

    return res.status(200).json({ status: "success", message, data: likedTracks });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error liking track' });
  }
};

exports.tracksList = async (options, user, selected_track_id, res) => {
  try {
    let whereClauses = [];
    let queryParams = [];

    if (options.creator_id) {
      whereClauses.push(`tracks.user_id = ?`);
      queryParams.push(parseInt(options.creator_id));
    }

    if (options.genre & options.genre!='all') {
      whereClauses.push(`
        tracks.id IN (
          SELECT track_id FROM TrackToGenres WHERE genre_id = ?
        )
      `);
      queryParams.push(parseInt(options.genre));
    }

    if (options.like) {
      if (user) {
        whereClauses.push(`
          tracks.id IN (
            SELECT track_id FROM TrackLike WHERE user_id = ?
          )
        `);
        queryParams.push(user.id);
      } else {
        return res.status(200).json({
          status: 'success',
          data: {
            tracks: [],
            meta: {
              total: 0,
              page: 1,
              last_page: 1,
              page_size: 10,
              nextPage: null,
            },
          },
        });
      }
    }

    // Exclude selected track
    whereClauses.push(`tracks.id != ?`);
    queryParams.push(parseInt(selected_track_id));

    let whereQuery = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Randomize results if options.latest is falsy, otherwise order by creation date
    let orderByClause = options.latest ? `ORDER BY tracks.created_at DESC` : `ORDER BY RAND()`;

    // Raw SQL query to fetch tracks and related artiste data
    const tracks = await prisma.$queryRawUnsafe(`
      SELECT tracks.*, 
        users.id as artiste_id, 
        users.first_name, 
        users.last_name, 
        users.email, 
        users.profile_photo
      FROM tracks 
      JOIN users ON tracks.user_id = users.id
      ${whereQuery}
      ${orderByClause}
      LIMIT 50;
    `, ...queryParams);

    const totalTracksCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM tracks
      ${whereQuery};
    `, ...queryParams);

    // Transform tracks data into desired format
    const formattedTracks = tracks.map((track) => ({
      id: track.id,
      title: track.title,
      user_id: track.user_id,
      slug: track.slug,
      duration: track.duration,
      cover: track.cover,
      file: track.file,
      album_id: track.album_id,
      release_date: track.release_date,
      featured: track.featured,
      about: track.about,
      created_at: track.created_at,
      updated_at: track.updated_at,
      artiste: {
        id: track.artiste_id,
        first_name: track.first_name,
        last_name: track.last_name,
        email: track.email,
        profile_photo: track.profile_photo,
      },
    }));

    const paginatedResult = {
      tracks: formattedTracks,
      meta: {
        // Convert BigInt to a regular number
        total: Number(totalTracksCount[0].count) + 1, // Adding 1 for the excluded track
        page: 1,
        last_page: 1,
        page_size: 10,
        nextPage: null,
      },
    };

    return res.status(200).json({
      status: 'success',
      data: paginatedResult,
    });

  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 'fail',
      error: error,
      message: 'Could not fetch tracks.',
    });
  }
};




exports.playTrack = async (track_id, parsedUrl, user, res) => {
  const queryString = parsedUrl.query;
  
  let option = {}
  if (queryString.list_type) {
    switch (queryString.list_type) {
      case "artiste":
          option.creator_id = queryString.value
        break;
      case "genre":
          option.genre = queryString.value
        break;
      case "recent_release":
          option.latest = queryString.value
        break;
      default:
        break;
    }
  }

  return this.tracksList(option, user, track_id, res)
}


exports.recordAndUpdatePlay = async (user, track_id, time, status) => {
  const now = new Date();

  // Calculate the threshold for 30 minutes ago
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000);

 const existingPlay =  await prisma.playback_progress.findFirst({
    where:{
        user_id:user.id,
        track_id:track_id,

        OR: [
          { status: 'playing' },
          { status: 'paused' }
        ],
        updated_at: {
          lt: thirtyMinutesAgo // Greater than or equal to 30 minutes ago
        }
    }

  })
  if(existingPlay){
    await prisma.playback_Progress.update({
      where: {
        id: existingPlay.id, // Using the fetched item's ID
      },
      data: {
        playback_position: time,
        status: status, // Updating the status
      },
    });
  }else{
    await prisma.playback_Progress.create({
        data: {
          playback_position: time,
          status: status, // Updating the status
        },
      });
  }
}