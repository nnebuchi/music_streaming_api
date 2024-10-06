const { v2: cloudinary } = require('cloudinary');

module.exports = {
    storage: {
      local: {
        root: 'public/uploads',
        // access_url: ''
      },
      s3: {
        bucket: 'your-bucket',
        accessKeyId: 'YOUR_ACCESS_KEY_ID',
        secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
        region: 'your-region'
      },
      cloudinary: {
        root: process.env.CLOUDINARY_ROOT
      }
    }
  };

  module.exports.coudinaryConfig = () => {
    cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

