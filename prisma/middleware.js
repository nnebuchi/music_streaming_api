const {fileBaseUrl} = require('../utils/file');
exports.user_middleware = async (params, next) => {
    const result = await next(params);
  
    if (params.model === 'Users' && 
        [
          'findUnique', 
          'findMany', 
          'findFirst', 
          'groupBy', 
          'aggregate'
        ].includes(params.action)
    ) {
      if (Array.isArray(result)) {
        result.forEach(async (user) => {
          user.profile_photo = await fileBaseUrl(user.profile_photo);
          user.cover_photo =  await fileBaseUrl(user.cover_photo);
        });
      } else {
        result.profile_photo = await fileBaseUrl(result.profile_photo);
        result.cover_photo = await fileBaseUrl(result.cover_photo);
      }
    }
  
    return result;
};

exports.song_middleware = async (params, next) => {
  console.log('Song middleware executed');
  
  try {
    const result = await next(params);

    if (params.model === 'Tracks' && 
        [
          'findUnique', 
          'findMany', 
          'findFirst', 
          'groupBy', 
          'aggregate'
        ].includes(params.action)
    ) {
      console.log('Updating track files');
      
      if (Array.isArray(result)) {
        result.forEach(async (track) => {
          try {
            track.file = await fileBaseUrl(track.file);
            track.video_file = await fileBaseUrl(track.video_file);
            track.cover = await fileBaseUrl(track.cover);
          } catch (error) {
            console.error('Error updating track:', error);
          }
        });
      } else {
        try {
          result.file = await fileBaseUrl(result.file);
          result.video_file = await fileBaseUrl(result.video_file);
          result.cover = await fileBaseUrl(result.cover);
        } catch (error) {
          console.error('Error updating track:', error);
        }
      }
    }

    console.log('Song middleware finished');
    
    return result;
  } catch (error) {
    console.error('Middleware error:', error);
    throw error;
  }
};

// exports.song_middleware = async (params, next) => {
//   const result = await next(params);

//   if (params.model === 'Tracks' && 
//       [
//         'findUnique', 
//         'findMany', 
//         'findFirst', 
//         'groupBy', 
//         'aggregate'
//       ].includes(params.action)
//   ) {
//     if (Array.isArray(result)) {
//       result.forEach(async (track) => {
//         track.file = await fileBaseUrl(track.file);
//         track.video_file = await fileBaseUrl(track.video_file);
//         track.cover =  await fileBaseUrl(track.cover);
//       });
//     } else {
//       result.file = await fileBaseUrl(result.file);
//       result.video_file = await fileBaseUrl(result.video_file);
//       result.cover = await fileBaseUrl(result.cover);
//     }
//   }

//   return result;
// };