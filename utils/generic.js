exports.generateOTP = async () =>{
    const val = Math.floor(1000 + Math.random() * 9000);
    console.log(val);
    return val;
}

exports.renameUploadedFile = async (original_name) => {
    const timestamp = Date.now();
    return `${timestamp}_${original_name.replaceAll(' ', '_')}`
}