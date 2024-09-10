const crypto = require('crypto');
exports.generateOTP = async () =>{
    const val = Math.floor(1000 + Math.random() * 9000);
    return val;
}

exports.randomString = async (char_len) => {
    return crypto.randomBytes(parseInt(char_len)).toString('hex');
}

exports.slugify = async (string) => {
    // Remove special characters and spaces
    const sanitizedString = string.replace(/[^a-zA-Z0-9]/g, '');
  
    // Generate a random string of 5 characters
    const randString = await this.randomString(5)
  
    // Combine the sanitized string and random string
    const slug = `${sanitizedString}-${randString}`;
  
    return slug;
  }

exports.renameUploadedFile = async (original_name) => {
    const timestamp = Date.now();
    const result = `${timestamp}_${original_name.replaceAll(' ', '_')}`;
    
    return result;
}

exports.excludeCast = async (data, cast_arr) =>{
    try {
      for(let prop in data){  
        if(cast_arr.includes(prop)){
          delete data[prop]
        }
      }
      
      return data;
    } catch (error) {
      console.log(error);
      
      return error
    }
   
  }