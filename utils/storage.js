const config = require('../config/filesystem');
const fs = require('fs');
const path = require('path');
// const AWS = require('aws-sdk'); 

const storage = {
    getDisk(diskName) {
        const diskConfig = config.storage[diskName];
        if (!diskConfig) {
          throw new Error(`Disk '${diskName}' not configured`);
        }
        return diskConfig;
      },
    
      async put(file, disk = 'local') {
        const diskConfig = this.getDisk(disk);
    
        // Handle different storage types here
        if (disk === 'local') {
          const filePath = path.join(diskConfig.root, file.originalname);
          await file.mv(filePath);
          return filePath;
        } else if (disk === 's3') {
          // Use an S3 library to upload the file
        }
      },
    // Add other methods like get, delete, etc.


    async saveChunk(file, chunkIndex, totalChunks) {
      console.log("saveChunk");
      const diskConfig = this.getDisk('local'); // Adjust disk as needed
      const filePath = path.join(diskConfig.root, `temp/${file.originalname}_${chunkIndex}`);
      await file.mv(filePath);
      // Add logic to check if all chunks are uploaded and merge if necessary
    },
};



module.exports = storage;