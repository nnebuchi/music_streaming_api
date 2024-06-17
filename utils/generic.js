exports.generateOTP = async () =>{
    const val = Math.floor(1000 + Math.random() * 9000);
    console.log(val);
    return val;
}