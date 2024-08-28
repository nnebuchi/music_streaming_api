exports.generateOTP = async () =>{
    const val = Math.floor(1000 + Math.random() * 9000);
    return val;
}

exports.renameUploadedFile = async (original_name) => {
    const timestamp = Date.now();
    const result = `${timestamp}_${original_name.replaceAll(' ', '_')}`;
    
    return result;
}