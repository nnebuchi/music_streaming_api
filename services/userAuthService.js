const { PrismaClient } = require('@prisma/client');
const prisma  = new PrismaClient();
const argon2 = require('argon2');
const crypto = require('crypto');
const {send_mail} = require('./mail/accountVerification');
const jwt = require('jsonwebtoken');
const secretKey= process.env.AUTH_SEC_KEY;
const {generateOTP} = require('../utils/generic');
const { log } = require('console');


exports.createUser = async(user_data, res) => {
    try {
        const HashedPassword = await argon2.hash(user_data?.password)
        user_data.password = HashedPassword;
        const user = await prisma.users.create({
            data:user_data
        });

        if(user){
            const handleOtp = await sendOtp({ name:user.first_name, recipient:user.email, purpose:"account_verification" }, res);
            if(handleOtp?.status){
                console.log(handleOtp);
                return res.status(201).json({
                    status:"success",
                    message:"Registration successful, check your email for a verification code",
                });
            }else{
                return res.status(201).json({
                    status:"success",
                    message:"registration successful, but OTP was not sent. Kindly resend OTP",
                    error: handleOtp.error
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

exports.resendOtp = async (email, purpose, res) => {
    try {
        const user = await prisma.users.findUnique({
            where:{email:email}
        });
        
        if(user){
            return sendOtp({ name:user.first_name, recipient:user.email, purpose:purpose }, res)
        }
        else{
            return {
                status: false,
                error:"Could not get user"
            };
        }
    } catch (error) {
         return {
                status: false,
                error:error
            };
    }
    
}

const sendOtp = async (mail_data, res) => {
    
    try {
        const code = await generateOTP();
        const storeOtp = await saveOtp(code, mail_data.recipient);
        
        
        mail_data.code = code;
        if(storeOtp){
               
                
            const mail_res = await send_mail(mail_data, mail_data.purpose.replaceAll('_', " ").toUpperCase(), "Gracious Hearts Music", res)
            // return
            return {
                status: true
            };
        }
    } catch (error) {
        console.log(error);
        return {
            status: true,
            error:error
        };
       
    }
   
    
}

const saveOtp = async (otp, email) => {
    try {
        const delete_otps = await deleteUserOtps(email)
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
        await prisma.otps.deleteMany({
            where: {email:email},
        });
        return true;
    } catch (error) {
        console.log(error);
        return false
    }
}

exports.verifyOtp = async ({otp, email, purpose, new_password}, res) => {
    try {
        const otp_in_db =  await prisma.otps.findUnique({
            where: {email:email, otp:otp.toString()},
        })
        
        if(otp_in_db){
            console.log(otp_in_db);
            if(purpose && purpose === "reset_password") {
               
                return res.status(200).json({
                    status:"success",
                    message:"verified",
                });
            }
            const delete_otps = await deleteUserOtps(email)
            if(delete_otps === true){
                if(new_password){
                    await prisma.users.update({
                        where: { email: email },
                        data: {
                            password: await argon2.hash(new_password)
                        }
                    }); 

                }else{
                    await prisma.users.update({
                        where: { email: email },
                        data: {
                            is_verified: 1
                        }
                    }); 
                }
                return res.status(200).json({
                    status:"success",
                    message:"Completed",
                });
                
            }else{
                return res.status(400).json({
                    status:"fail",
                    message:"Failed to delete existing Otps",
                });
            }
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
            message:"Something Went Wrong",
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
            const passwordCheck = await argon2.verify(user.password, req_data.password);
            if(passwordCheck){
                console.log(passwordCheck);
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
                    is_verified:user.is_verified == '0' ? false : true,
                    token: jwt.sign(payload, secretKey, options)
                })
            }else{
                return res.status(400).json({
                    status:"fail",
                    message:"login failed",
                    error:"Invalid Credentials"
                });
            }
           
        }else{
            return res.status(400).json({
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

