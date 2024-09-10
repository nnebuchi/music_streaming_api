const multer = require('multer');
const {renameUploadedFile} = require('../utils/generic');
const file_config = require('../config/filesystem');
const file_disks = file_config.storage;
const fs = require('fs-extra');

exports.storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const diskName = req.body.disk || 'local'; // Default to 'local'
        const uploadPath = diskName === 'local' ? './uploads' : ''; // Handle other file_disks
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});


// const storeFile = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'public/uploads/profile-photos');
//     },
//     filename: async (req, file, cb) => {
//       cb(null, await renameUploadedFile(file.originalname)); 
//     }
//   });

// exports.uploadFile = multer({ storage: storeFile});






const saveFile = (directory, disk='local') => {
  
  return  multer.diskStorage({
    destination: async (req, file, cb) => {
      const file_path = file_disks[disk]['root'];
       await fs.ensureDir(`${file_path}/${directory}`);
      cb(null, `${file_path}/${directory}`); // Specify the directory where files will be stored
    },
    filename: async (req, file, cb) => {
      // console.log(file);
      
      cb(null, await renameUploadedFile(file.originalname)); 
    }
  });
}




exports.uploadProfilePhoto = multer({ storage: saveFile('profile_photos')});

exports.uploadCoverPhoto = multer({ storage: saveFile('cover_photos')});

exports.uploadTrackCoverPhoto = multer({ storage: saveFile('track_covers')});

exports.uploadTrackFile = multer({ dest: 'public/uploads/temp/' });




