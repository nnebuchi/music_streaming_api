const { PrismaClient } = require('@prisma/client');
const prisma  = new PrismaClient();
const argon2 = require('argon2');
const crypto = require('crypto');
const {send_mail} = require('./mail/accountVerification');
const jwt = require('jsonwebtoken');
const secretKey= process.env.AUTH_SEC_KEY;
const {generateOTP} = require('../utils/generic');


exports.createUser = async(user_data, res) => {
    try {
        const HashedPassword = await argon2.hash(user_data?.password)
        user_data.password = HashedPassword;
        // console.log(user_data);
        
        const user = await prisma.users.create({
            data:user_data
        });

        if(user){
            const code = await generateOTP();
            const storeOtp = await saveOtp(code, user.email);
            if(storeOtp){
                
                await send_mail({ name: user.first_name, code: code, email:user.email }, "Account Verification", "Gracious Hearts Music", res)
                return res.status(201).json({
                    status:"success",
                    message:"registration successful, check your email for a verification code",
                });
            }else{
                return res.status(200).json({
                    status:"success",
                    message:"registration successful, but OTP was not sent. Kindly resend OTP",
                });
            }
            
        }

    } catch (error) {
        res.status(400).json({ 
            status: 'fail',
            error: error.message
        });
    }
   
}

const saveOtp = async (otp, email) => {
    try {
        await deleteUserOtps(email)
        // const existingOtp = await prisma.findMany()
        return await prisma.otps.create({
            data:{ email:email, otp:otp.toString()}
        });

    } catch (error) {
        console.log(error);
        return false
    }
}

const deleteUserOtps = async (email) => {
    try {
        return await prisma.otps.deleteMany({
            where: {email:email},
        });
    } catch (error) {
        console.log(error);
        return false
    }
}

exports.verifyOtp = async (otp, email, res) => {
    try {
        const otp_in_db =  await prisma.otps.findUnique({
            where: {email:email, otp:otp.toString()},
        })
        
        if(otp_in_db){
            await deleteUserOtps(email);
            return res.status(200).json({
                status:"success",
                message:"OTP verified successfully",
            });
        }else{
            return res.status(400).json({
                status:"fail",
                message:"Invalid OTP supplied",
                error:"Invalid OTP"
            });
        }
    } catch (error) {
        return res.status(400).json({
            status:"fail",
            message:"Somehting Went Wrong",
            error:error
        });
    }
}

exports.loginUser = async(req_data, res) => {
    try {
        const user = await prisma.users.findUnique({
            where:{email:req_data.email}
        });

        if(user){
            const passwordCheck = argon2.verify(user.password, req_data.password);
            if(passwordCheck){
                const key = crypto.randomBytes(64).toString('hex');
                const payload = {
                    id: user.id,
                    email: user.email
                }
        
                const options = {
                    expiresIn: 365 * 24 * 60 * 60,
                    // httpOnly: true
                }
                return res.status(200).json({
                    status:"success",
                    message:"login successful",
                    token: jwt.sign(payload, secretKey, options)
                })
            }else{
                return res.status(200).json({
                    status:"fail",
                    message:"login failed",
                    error:"Invalid Credentials"
                });
            }
           
        }else{
            return res.status(200).json({
                status:"fail",
                message:"login failed",
                error:"Invalid Credentials"
            });
        }
       
    } catch (error) {
        return res.status(400).json({ 
            status: 'fail',
            error: error.message
        });
    }
   
}

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};


