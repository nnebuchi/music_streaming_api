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
      }
    }
  };