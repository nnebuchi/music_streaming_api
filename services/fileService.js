const multer = require('multer');
const {renameUploadedFile} = require('../utils/generic');
// const disk = require('../utils/disk');

exports.storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const diskName = req.body.disk || 'local'; // Default to 'local'
        const uploadPath = diskName === 'local' ? './uploads' : ''; // Handle other disks
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});


const storeFile = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/profile-photos'); // Specify the directory where files will be stored
    },
    filename: async (req, file, cb) => {
      cb(null, await renameUploadedFile(file.originalname)); 
    }
  });

exports.uploadFile = multer({ storage: storeFile});



